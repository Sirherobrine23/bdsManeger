import { extendsFS } from "@sirherobrine23/extends";
import { http } from "@sirherobrine23/http";
import AdmZip from "adm-zip";
import child_process from "node:child_process";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import { finished } from "node:stream/promises";
import tar from "tar";
import { bdsFilesBucket } from "../../internalClouds.js";
import { customEvent, defineEvents } from "../../serverRun.js";
import * as bedrockVersions from "./listVersion.js";

export type platforms = "mojang" | "pocketmine" | "powernukkit" | "nukkit" | "cloudburst";

export interface bedrockPorts {
  port: number;
  localListen?: string;
};

export interface playerInfo {
  connected: boolean;
  banned: boolean;
  xuid?: string;
  historic: {
    action: string;
    actionDate: Date;
  }[];
};

class playerListen extends Map<string, playerInfo> {
  constructor(origem?: Record<string, playerInfo>) {
    super(Object.keys(origem || {}).map(key => ([key, origem[key]])));
  }

  toJSON() {
    return Array.from(this.keys()).reduce<{ [playerName: string]: playerInfo }>((acc, player) => {
      acc[player] = this.get(player);
      return acc;
    }, {});
  }

  init(playerName: string): this {
    if (!(this.has(playerName))) {
      super.set(playerName, {
        banned: false,
        connected: false,
        historic: [],
      });
    }
    return this;
  }

  updateState(playerName: string, state: playerInfo["historic"][number]["action"]) {
    const actionDate = new Date();
    const playerData = this.init(playerName).get(playerName);
    if (state === "disconnected") playerData.connected = false; else playerData.connected = true;
    playerData.historic.push({ action: state, actionDate });
    super.set(playerName, playerData);
  }
}

/**
 * Return boolean if Class input is Bedrock class server
 * @param event - Bedrock class
 * @returns
 */
export function isBedrock(event: Bedrock<any>): event is Bedrock<any> {
  return event instanceof Bedrock;
}

export type bedrockEvents = defineEvents<{
  logLine(lineString: string): void;
  portListen(info: bedrockPorts): void;
  installedVersion(serverVersion: string): void;
}>;

export class Bedrock<P extends platforms> extends customEvent<bedrockEvents> {
  readonly serverFolder: string;
  readonly rootServer: string;
  readonly platform: P;
  constructor(rootServer: string, platform: P) {
    super();
    if ((!(["mojang", "pocketmine", "powernukkit", "nukkit", "cloudburst"]).includes(platform))) throw new Error("Invalid platform");
    this.platform = platform;
    this.rootServer = rootServer;
    this.serverFolder = path.join(rootServer, "server");
    Object.defineProperty(this, "rootServer", { writable: false });
    Object.defineProperty(this, "serverFolder", { writable: false });
    Object.defineProperty(this, "platform", { writable: false });
  }

  async installServer(version: string | number) {
    const { platform } = this;
    if (!(await extendsFS.exists(this.serverFolder))) await fs.mkdir(this.serverFolder, { recursive: true });
    if (platform === "mojang") {
      const release = bedrockVersions.mojangCache.get(version);
      if (!release) throw new Error("Not valid Release");
      const serverURL = release.url[process.platform]?.[process.arch]?.tgz;
      if (!serverURL) throw new Error("Current platform not support mojang server");
      let backupFiles = [{ file: "allowlist.json", data: "" }, { file: "permissions.json", data: "" }, { file: "server.properties", data: "" }];
      backupFiles = await Promise.all(backupFiles.map(async file => { file.data = await fs.readFile(path.join(this.serverFolder, file.file), "utf8").catch(() => ""); return file }));
      await finished((await http.streamRequest(serverURL)).pipe(tar.extract({ cwd: this.serverFolder, preserveOwner: true, keep: false })));
      await Promise.all(backupFiles.filter(file => !!(file.data.trim())).map(async file => fs.writeFile(path.join(this.serverFolder, file.file), file.data)));
      this.emit("installedVersion", bedrockVersions.mojangCache.prettyVersion(version));
    } else if (platform === "pocketmine") {
      const release = bedrockVersions.pocketmineCache.get(version);
      if (!release) throw new Error("Not valid Release");
      await finished((await http.streamRequest(release.url)).pipe(createWriteStream(path.join(this.serverFolder, "server.phar"))));
      let phpFiles = (await bdsFilesBucket.listFiles("php_bin/")).map(file => ({ name: file.name.slice(8).toLowerCase(), data: file })).filter(file => file.name.startsWith(`${process.platform}_${process.arch}`));
      if (!phpFiles.length) throw new Error("Cannot get php binary to current platform");
      const phpFile = phpFiles.sort((b, a) => a.data.Dates.Modified.getTime() - b.data.Dates.Modified.getTime()).at(0);
      const binPath = path.join(this.serverFolder, "bin");
      if (await extendsFS.exists(binPath)) await fs.rm(binPath, { recursive: true, force: true });
      if (phpFile.name.endsWith(".tar.gz") || phpFile.name.endsWith(".tgz")) await finished((await phpFile.data.getFile()).pipe(tar.extract({ cwd: binPath })));
      else if (phpFile.name.endsWith(".zip")) {
        const tmpFile = path.join(tmpdir(), Date.now() + "_" + phpFile.name);
        await finished((await phpFile.data.getFile()).pipe(createWriteStream(tmpFile)));
        await new Promise<void>((done, reject) => (new AdmZip(tmpFile)).extractAllToAsync(binPath, true, true, err => err ? reject(err) : done()));
        await fs.rm(tmpFile, { force: true });
      }
      this.emit("installedVersion", bedrockVersions.pocketmineCache.prettyVersion(version));
    } else if (platform === "powernukkit") {
      const release = bedrockVersions.powernukkitCache.get(version);
      if (!release) throw new Error("Not valid Release");
      await finished(await http.streamRequest(release.url), createWriteStream(path.join(this.serverFolder, "server.jar")));
      this.emit("installedVersion", bedrockVersions.powernukkitCache.prettyVersion(version));
    } else if (platform === "cloudburst" || platform === "nukkit") {
      const platformVersions = platform === "cloudburst" ? bedrockVersions.cloudburstCache : bedrockVersions.nukkitCache;
      const release = platformVersions.get(version);
      if (!release) throw new Error("Not valid Release");
      await finished(await http.streamRequest(release.url), createWriteStream(path.join(this.serverFolder, "server.jar")));
      this.emit("installedVersion", platformVersions.prettyVersion(version));
    }
  }

  ports: bedrockPorts[] = [];
  readonly players = new playerListen();

  serverProcess?: child_process.ChildProcess;
  async runServer() {
    const { platform } = this;
    const logLine: (bedrockEvents["logLine"])[] = [];

    if (platform === "mojang") {
      const fileExec = path.join(this.serverFolder, (await fs.readdir(this.serverFolder)).find(file => file.startsWith("bedrock_server")));
      if (process.platform !== "win32") await fs.chmod(fileExec, 0o775);
      this.serverProcess = child_process.spawn(fileExec, {
        cwd: this.serverFolder,
        stdio: ["pipe", "pipe", "pipe"]
      });
      logLine.push(lineString => {
        // [INFO] IPv4 supported, port: 19132
        // [2023-03-08 13:01:57 INFO] Listening on IPv4 port: 19132
        const ipProtocol = lineString.slice(lineString.indexOf("IPv"), lineString.indexOf("IPv")+4);
        if (ipProtocol) {
          let port = lineString.slice(lineString.lastIndexOf("port:")+5).trim();
          if (port.indexOf(":") !== -1) port = port.slice(0, port.lastIndexOf(":"));
          const info: bedrockPorts = {
            port: Number(port),
            localListen: ipProtocol.toLowerCase() === "ipv4" ? "0.0.0.0" : "[::]",
          };
          this.ports.push(info);
          this.emit("portListen", info);
        }
        return null;
      }, lineString => {
        lineString = lineString.replace(/^(.*)?\[.*\]/, "").trim();
        if (lineString.startsWith("Player")) {
          lineString = lineString.replace("Player", "").trim();

          // Spawned, disconnected, connected
          let action: string;
          if (lineString.startsWith("Spawned")) action = "Spawned";
          else if (lineString.startsWith("disconnected")) action = "disconnected";
          else if (lineString.startsWith("connected")) action = "connected";
          if (!action) return null;
          lineString = lineString.replace(action, "").trim();
          if (lineString.startsWith(":")) lineString = lineString.slice(1).trim();

          let playerName = lineString.substring(0, lineString.indexOf("xuid:")-1).trim();
          if (!playerName) return null;
          if (playerName.endsWith(",")) playerName = playerName.slice(0, playerName.length - 1);

          let xuid: string;
          if (lineString.indexOf("xuid:") !== -1) {
            xuid = lineString.slice(lineString.indexOf("xuid:")+5).trim();
            if (!xuid) xuid = null;
          }

          if (!(this.players.has(playerName))) this.players.init(playerName);
          if (!!xuid) {
            if (!(this.players.get(playerName)).xuid) {
              const info = this.players.get(playerName);
              info.xuid = xuid;
              this.players.set(playerName, info);
            }
          }
          this.players.updateState(playerName, action);
        }
      });
    } else if (platform === "pocketmine") {
      const phpBin = (await extendsFS.readdirV2(this.serverFolder)).find(file => file.endsWith("php") || file.endsWith("php.exe"));
      if (!phpBin) throw new Error("Fist install php binary in server folder");
      this.serverProcess = child_process.spawn(phpBin, ["server.phar", "--no-wizard"], {
        cwd: this.serverFolder,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else if (platform === "nukkit" || platform === "powernukkit" || platform === "cloudburst") {
      this.serverProcess = child_process.spawn("java", [
        "-XX:+UseG1GC",
        "-XX:+ParallelRefProcEnabled",
        "-XX:MaxGCPauseMillis=200",
        "-XX:+UnlockExperimentalVMOptions",
        "-XX:+DisableExplicitGC",
        "-XX:+AlwaysPreTouch",
        "-XX:G1NewSizePercent=30",
        "-XX:G1MaxNewSizePercent=40",
        "-XX:G1HeapRegionSize=8M",
        "-XX:G1ReservePercent=20",
        "-XX:G1HeapWastePercent=5",
        "-XX:G1MixedGCCountTarget=4",
        "-XX:InitiatingHeapOccupancyPercent=15",
        "-XX:G1MixedGCLiveThresholdPercent=90",
        "-XX:G1RSetUpdatingPauseTimePercent=5",
        "-XX:SurvivorRatio=32",
        "-XX:+PerfDisableSharedMem",
        "-XX:MaxTenuringThreshold=1",
        "-Dusing.aikars.flags=https://mcflags.emc.gs",
        "-Daikars.new.flags=true",
        "-jar", "server.jar",
      ], {
        cwd: this.serverFolder,
        stdio: ["pipe", "pipe", "pipe"],
      });
    }

    // Break lines
    ([
      readline.createInterface(this.serverProcess.stdout),
      readline.createInterface(this.serverProcess.stderr)
    ]).map(inter => inter.on("error", err => this.emit("error", err)).on("line", data => {
      this.emit("logLine", data);
      logLine.forEach(fn => Promise.resolve().then(() => fn(data)).catch(err => this.emit("error", err)));
    }));

    return this.serverProcess;
  }

  writeLn(data: string | Buffer) {
    this.serverProcess.stdin.write(data);
    if (Buffer.isBuffer(data) && (String.fromCharCode(data.at(-1)) !== "\n")) this.serverProcess.stdin.write("\n");
    else if (typeof data === "string" && !(data.trim().endsWith("\n"))) this.serverProcess.stdin.write("\n");
    return this;
  }

  async stopServer() {
    this.writeLn("stop");
    return new Promise<{ code: number, signal: NodeJS.Signals }>((done, reject) => this.serverProcess.once("error", reject).once("exit", (code, signal) => done({ code, signal })));
  }

  async setPlayerPermission(playername: string, permission: P extends "mojang" ? "operator" | "member" | "visitor" : "admin" | "user") {
    if (this.platform === "mojang") {
      const permissions: { permission: "operator" | "member" | "visitor", xuid: string }[] = JSON.parse(await fs.readFile(path.join(this.serverFolder, "permissions.json"), "utf8"));
      permissions.push({
        permission: permission as any,
        xuid: playername
      });
      await fs.writeFile(path.join(this.serverFolder, "permissions.json"), JSON.stringify(permissions));
      if (this.serverProcess) this.writeLn("permission reload");
    }
  }

  async allowList(playername: string, options?: { xuid?: string, ignoresPlayerLimit?: boolean }) {
    if (this.platform === "mojang") {
      const permissions: { ignoresPlayerLimit: boolean, name: string, xuid?: string }[] = JSON.parse(await fs.readFile(path.join(this.serverFolder, "allowlist.json"), "utf8"));
      await fs.writeFile(path.join(this.serverFolder, "allowlist.json"), JSON.stringify(permissions));
      permissions.push({
        name: playername,
        ignoresPlayerLimit: options?.ignoresPlayerLimit ?? false,
        xuid: options?.xuid
      });
      if (this.serverProcess) this.writeLn("allowlist reload");
    }
  }
}