import { platformManeger } from "@the-bds-maneger/server_versions";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import { spigotProprieties } from "./spigot";
import * as globalPlatfroms from "./globalPlatfroms";
import * as coreUtils from "@the-bds-maneger/core-utils";
import Proprieties from "./lib/Proprieties";
import fsOld from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, id } = await pathControl("paper", platformOptions);
  const release = await platformManeger.paper.find(version);
  await coreUtils.httpRequestLarge.saveFile({url: release.url, filePath: path.join(serverPath, "paper.jar")});
  return {
    id,
    version: release.version,
    url: release.url,
    date: release.date
  };
}

export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
export const playerAction = /\[.*\]:\s+([\S\w]+)\s+(joined|left|lost)/;
export const paperHook: globalPlatfroms.actionsV2 = {
  serverStarted(data, done) {
    // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
    if (started.test(data)) done(new Date());
  },
  playerAction(data, playerConnect, playerDisconnect, playerUnknown) {
    if (playerAction.test(data)) {
      const [, playerName, action] = data.match(data)||[];
      if (action === "joined") playerConnect({playerName, connectTime: new Date()});
      else if (action === "left") playerDisconnect({playerName, connectTime: new Date()});
      else if (action === "lost") playerUnknown({playerName, connectTime: new Date(), action: "lost"});
      else playerUnknown({playerName, connectTime: new Date()});
    }
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
      protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6"
    });
  },
  stopServer(components) {
    components.actions.runCommand("stop");
    return components.actions.waitExit();
  },
};

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean, platformOptions?: bdsPlatformOptions}) {
  const { serverPath, logsPath, id } = await pathControl("paper", Config?.platformOptions||{id: "default"});
  if (!fsOld.existsSync(path.join(serverPath, "paper.jar"))) throw new Error("Install server fist.");
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

  args.push("-jar", path.join(serverPath, "paper.jar"), "nogui");
  const eula = path.join(serverPath, "eula.txt");
  await fs.writeFile(eula, (await fs.readFile(eula, "utf8").catch(() => "eula=false")).replace("eula=false", "eula=true"));
  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.log`);
  return globalPlatfroms.actionV2({
    id, platform: "paper",
    processConfig: {command: "java", args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: paperHook
  });
}

export async function getConfig(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("paper", platformOptions);
  return Proprieties.parse<spigotProprieties>(await fs.readFile(path.join(serverPath, "server.properties"), "utf8"));
}

// This is a fast and dirty way to implement a new feature, but i'm too exhausted to implement the same type as bedrock
export async function updateConfig(config: {key: string, value: any}, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const currentConfig = await getConfig(platformOptions);
  const { serverPath } = await pathControl("paper", platformOptions);
  currentConfig[config.key] = config.value;
  return fs.writeFile(path.join(serverPath, "server.properties"), Proprieties.stringify(currentConfig));
}
