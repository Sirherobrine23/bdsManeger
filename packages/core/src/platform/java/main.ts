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
import { customEvent, defineEvents } from "../../serverRun.js";
import * as javaVersions from "./listVersion.js";

export type platform = "mojang" | "spigot" | "paper" | "purpur" | "glowstone" | "folia" | "cuberite";
export type javaEvents = defineEvents<{
  logLine(lineString: string): void;
}>;

/**
 * Return boolean if Class input is Java class server
 * @param event - Java class
 * @returns
 */
export function isJava(event: Java<any>): event is Java<any> {
  return event instanceof Java;
}

export class Java<P extends platform> extends customEvent<javaEvents> {
  readonly serverFolder: string;
  readonly rootServer: string;
  readonly platform: P;
  constructor(rootServer: string, platform: P) {
    super();
    if ((!(["mojang", "spigot", "paper", "purpur", "glowstone", "folia", "cuberite"]).includes(platform))) throw new Error("Invalid platform");
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
      if (!javaVersions.mojangCache.size) await javaVersions.listMojang();
      await finished((await http.streamRequest(javaVersions.mojangCache.get(version).URL)).pipe(createWriteStream(path.join(this.serverFolder, "server.jar"))));
    } else if (platform === "spigot") {
      if (!javaVersions.spigotCache.size) await javaVersions.listSpigot();
      const spigotRel = javaVersions.spigotCache.get(version);
      await finished((await spigotRel.getServer()).pipe(createWriteStream(path.join(this.serverFolder, "server.jar"))));
      if (typeof spigotRel.craftbukkit === "function") await finished((await spigotRel.craftbukkit()).pipe(createWriteStream(path.join(this.serverFolder, "craftbukkit.jar"))));
    } else if (platform === "paper") {
      if (!javaVersions.paperCache.size) await javaVersions.listPaperProject();
      await finished((await http.streamRequest(javaVersions.paperCache.get(version).URL)).pipe(createWriteStream(path.join(this.serverFolder, "server.jar"))));
    } else if (platform === "purpur") {
      if (!javaVersions.purpurCache.size) await javaVersions.listPaperProject();
      await finished((await http.streamRequest(javaVersions.purpurCache.get(version).URL)).pipe(createWriteStream(path.join(this.serverFolder, "server.jar"))));
    } else if (platform === "glowstone") {
      if (!javaVersions.glowstoneCache.size) await javaVersions.listPaperProject();
      await finished((await http.streamRequest(javaVersions.glowstoneCache.get(version).URL)).pipe(createWriteStream(path.join(this.serverFolder, "server.jar"))));
    } else if (platform === "folia") {
      if (!javaVersions.foliaCache.size) await javaVersions.listGlowstoneProject();
      await finished((await http.streamRequest(javaVersions.foliaCache.get(version).URL)).pipe(createWriteStream(path.join(this.serverFolder, "server.jar"))));
    } else if (platform === "cuberite") {
      if (javaVersions.cuberiteCache.size < 3) await javaVersions.listCuberite();
      const files = javaVersions.cuberiteCache.get(`${process.platform}-${process.arch}`).URL;
      for (const fileURL of files) {
        if (fileURL.endsWith(".zip")) {
          const tmpFile = path.join(tmpdir(), Date.now() + "_" + path.basename((new URL(fileURL)).pathname));
          await finished((await http.streamRequest(fileURL)).pipe(createWriteStream(tmpFile)));
          await new Promise<void>((done, reject) => (new AdmZip(tmpFile)).extractAllToAsync(this.serverFolder, true, true, err => err ? reject(err) : done()));
          await fs.rm(tmpFile, { force: true });
        } else await finished((await http.streamRequest(fileURL)).pipe(tar.extract({cwd: this.serverFolder})));
      }
    }
  }

  serverProcess?: child_process.ChildProcess;
  async runServer() {
    if (this.platform === "cuberite") {
      let execPath = path.join(this.serverFolder, "Cuberite");
      if (process.platform === "win32") execPath += ".exe";
      this.serverProcess = child_process.spawn(execPath, {
        cwd: this.serverFolder,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else {
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

    // Break line
    ([
      readline.createInterface(this.serverProcess.stdout),
      readline.createInterface(this.serverProcess.stderr),
    ]).forEach(readline => readline.on("error", err => this.emit("error", err)).on("line", line => this.emit("logLine", line)));

    this.on("logLine", (line) => {
      line = line.replace(/^.*?\[.*\]:/, "").trim();
      if (line.startsWith("Starting Minecraft server on")) {
        if (line.lastIndexOf(":") === -1) return null;
        // const port = Number(line.slice(line.lastIndexOf(":")+1));
        // this.emit("portListen", {
        //   port,
        //   localListen: "0.0.0.0"
        // });
        // this.ports.push({
        //   port,
        //   localListen: "0.0.0.0"
        // });
      }
    });

    return this.serverProcess;
  }
}