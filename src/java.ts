import * as coreUtils from "@sirherobrine23/coreutils";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { actionV2, actionsV2 } from "./globalPlatfroms";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import { manegerConfigProprieties } from "./configManipulate";
import { randomPort } from "./lib/randomPort";
import fsOld from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, serverRoot, platformIDs, id } = await pathControl("java", platformOptions);
  const javaDownload = await platformManeger.java.find(version);
  await coreUtils.httpRequestLarge.saveFile({url: javaDownload.url, filePath: path.join(serverPath, "server.jar")});
  await fs.writeFile(path.join(serverRoot, "version_installed.json"), JSON.stringify({version: javaDownload.version, date: javaDownload.date, installDate: new Date()}));

  if (platformIDs.length > 1) {
    const platformPorts = (await Promise.all(platformIDs.map(id => serverConfig({id})))).map(config => config.getConfig()["server-port"]);
    let port: number;
    while (!port) {
      const tmpNumber = await randomPort();
      if (platformPorts.some(ports => ports === tmpNumber)) continue;
      port = tmpNumber;
    };
    await (await serverConfig({id})).editConfig({name: "serverPort", data: port}).save();
  }

  return {
    id,
    version: javaDownload.version,
    date: javaDownload.date,
    url: javaDownload.url
  };
}

export const started = /\[.*\].*\s+Done\s+\([0-9\.]+s\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
export const playerAction = /\[.*\]:\s+([\S\w]+)\s+(joined|left|lost)/;
const javaHooks: actionsV2 = {
  serverStarted(data, done) {
    // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
    if (started.test(data)) done(new Date());
  },
  portListening(data, done) {
    const portParse = data.match(portListen);
    if (!portParse) return;
    let [,, host, port] = portParse;
    if (host === "*"||!host) host = "127.0.0.1";
    done({
      port: parseInt(port),
      type: "TCP",
      host: host,
      protocol: "IPV4/IPv6"
    });
  },
  playerAction(data, Callbacks) {
    if (playerAction.test(data)) {
      const [, playerName, action] = data.match(data)||[];
      if (action === "joined") Callbacks.connect({playerName, connectTime: new Date()});
      else if (action === "left") Callbacks.disconnect({playerName, connectTime: new Date()});
      else if (action === "lost") Callbacks.unknown({playerName, connectTime: new Date(), action: "lost"});
      else Callbacks.unknown({playerName, connectTime: new Date()});
    }
  },
  stopServer(components) {
    components.actions.runCommand("stop");
    return components.actions.waitExit();
  },
};

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean, platformOptions?: bdsPlatformOptions}) {
  const { serverPath, logsPath, id } = await pathControl("java", Config?.platformOptions||{id: "default"});
  const jarPath = path.join(serverPath, "server.jar");
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const command = "java";
  const args = [
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
    "-XX:+UnlockDiagnosticVMOptions",
    "-XX:-UseAESCTRIntrinsics"
  ];
  if (Config) {
    if (Config.maxFreeMemory) {
      const safeFree = Math.floor(os.freemem()/1e6);
      if (safeFree > 1000) Config.maxMemory = safeFree;
      else console.warn("There is little ram available!")
    }
    if (Config.maxMemory) args.push(`-Xmx${Config.maxMemory}m`);
    if (Config.minMemory) args.push(`-Xms${Config.minMemory}m`);
  }
  args.push("-jar", jarPath, "nogui");
  const eula = path.join(serverPath, "eula.txt");
  await fs.writeFile(eula, (await fs.readFile(eula, "utf8").catch(() => "eula=false")).replace("eula=false", "eula=true"));
  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.log`);
  return actionV2({
    id, platform: "java",
    processConfig: {command, args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: javaHooks
  });
}

export type Gamemode = {name: "Gamemode", data: "survival"|"creative"|"hardcore"};
export type Difficulty = {name: "Difficulty", data: "peaceful"|"easy"|"normal"|"hard"};
export type serverPort = {name: "serverPort", data: number};
export type maxPlayers = {name: "maxPlayers", data: number};
export type allowList = {name: "allowList", data: boolean};
export type serverDescription = {name: "serverDescription", data: string};
export type worldName = {name: "worldName", data: string};
export type editConfig = Gamemode|Difficulty|serverPort|maxPlayers|allowList|serverDescription|worldName;

/**
 * Update java server config
 * @param platformOptions
 * @returns
 */
export async function serverConfig(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("java", platformOptions);
  const fileProperties = path.join(serverPath, "server.properties");
  if (!await coreUtils.extendFs.exists(fileProperties)) await fs.cp(path.join(__dirname, "../configs/java/server.properties"), fileProperties);
  return manegerConfigProprieties<editConfig>({
    configPath: fileProperties,
    configManipulate: {
      Gamemode: (fileConfig, value: string) => {
        if (!(["survival", "creative", "hardcore"]).includes(value)) throw new Error("Invalid gameode");
        if (value === "hardcore") fileConfig = fileConfig.replace(/gamemode=(survival|creative)/, `gamemode=survial`).replace(/hardcore=(false|true)/, `hardcore=true`);
        else {
          if (!(value === "survival"||value === "creative")) throw new Error("Invalid gamemode");
          fileConfig = fileConfig.replace(/gamemode=(survival|creative)/, `gamemode=${value}`).replace(/hardcore=(false|true)/, `hardcore=false`);
        }
        return fileConfig;
      },
      Difficulty: {
        validate: (value: string) => (["peaceful", "easy", "normal", "hard"]).includes(value),
        regexReplace: /difficulty=(peaceful|easy|normal|hard)/,
        valueFormat:  "difficulty=%s"
      },
      serverPort: {
        validate: (value: number) => value > 1000,
        regexReplace: /server-port=([0-9]+)/,
        valueFormat: "server-port=%f"
      },
      maxPlayers: {
        validate: (value: number) => value > 1,
        regexReplace: /max-players=([0-9]+)/,
        valueFormat: "max-players=%f"
      },
      serverDescription: {
        validate: (value: string) => value.length < 50,
        regexReplace: /motd=(.*)/,
        valueFormat: "motd=%s"
      },
      worldName: {
        validate: (value: string) => value.length < 50,
        regexReplace: /level-name=(.*)/,
        valueFormat: "level-name=%s"
      },
      allowList: {
        validate: (value: boolean) => value === true||value === false,
        regexReplace: /white-list=(true|false)/,
        valueFormat: "white-list=%o"
      }
    }
  })
}
