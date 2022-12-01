import { platformManeger } from "@the-bds-maneger/server_versions";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import { httpRequestLarge } from "@sirherobrine23/coreutils";
import * as globalPlatfroms from "./globalPlatfroms";
import path from "node:path";
import fsOld from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, id } = await pathControl("powernukkit", platformOptions);
  const jarPath = path.join(serverPath, "pwnukkit.jar");
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  const pwNukktiData = await platformManeger.powernukkit.find(version);
  await httpRequestLarge.saveFile({url: pwNukktiData.url, filePath: jarPath})
  return {
    id,
    version: pwNukktiData.version,
    url: pwNukktiData.url,
    date: pwNukktiData.date
  }
}

export const playerAction = /^.*\[.*\]\s([\S\w]+|"[\S\w]+")\s+(left|joined)\s+the\s+game$/;
export const portListen = /Opening\s+server\s+on\s+(([A-Za-z0-9:\.]+):([0-9]+))/;
export const powernukkitHooks: globalPlatfroms.actionsV2 = {
  serverStarted(data, done) {
    // 16:57:15 [INFO ] Done (2.122s)! For help, type "help" or "?"
    if (/^.*\[.*\]\s+Done\s+\([0-9\.]+s\)!/.test(data)) done(new Date());
  },
  portListening(data, done) {
    if (portListen.test(data)) {
      const [,, host, port] = data.match(portListen);
      done({
        port: parseInt(port),
        type: "UDP",
        protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
        host: host
      })
    }
  },
  playerAction(data, playerConnect, playerDisconnect, playerUnknown) {
    if (playerAction.test(data)) {
      const [, playerName, action] = data.match(playerAction)||[];
      if (action === "joined") playerConnect({connectTime: new Date(), playerName});
      else if (action === "left") playerDisconnect({connectTime: new Date(), playerName});
      else playerUnknown({connectTime: new Date(), playerName});
    }
  },
  stopServer(components) {
    components.actions.runCommand("stop");
    return components.actions.waitExit();
  },
};

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean, platformOptions?: bdsPlatformOptions}) {
  const { serverPath, logsPath, id } = await pathControl("powernukkit", Config?.platformOptions||{id: "default"});
  const jarPath = path.join(serverPath, "pwnukkit.jar");
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
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
  args.push("-jar", jarPath, "--language", "eng");
  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.log`);
  return globalPlatfroms.actionV2({
    id, platform: "powernukkit",
    processConfig: {command: "java", args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: powernukkitHooks
  });
}
