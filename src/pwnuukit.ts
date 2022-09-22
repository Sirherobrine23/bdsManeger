import * as path from "node:path";
import * as fsOld from "node:fs";
import * as fs from "node:fs/promises";
import os from "node:os";
import { serverRoot, logRoot } from './pathControl';
import { actions, actionConfig } from './globalPlatfroms';
import { platformManeger } from "@the-bds-maneger/server_versions";
import { saveFile } from "./httpRequest";
export const serverPath = path.join(serverRoot, "power_nukkit");
const jarPath = path.join(serverPath, "pwnukkit.jar");

const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run: (child) => child.runCommand("stop")
  },
  {
    name: "serverStarted",
    callback(data, done) {
      // 16:57:15 [INFO ] Done (2.122s)! For help, type "help" or "?"
      if (/^.*\[.*\]\s+Done\s+\([0-9\.]+s\)!/.test(data)) done(new Date());
    },
  },
  {
    name: "portListening",
    callback(data, done) {
      const portListen = /Opening\s+server\s+on\s+(([A-Za-z0-9:\.]+):([0-9]+))/;
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
  },
  {
    name: "playerConnect",
    callback(data, done) {
      const playerAction = /^.*\[.*\]\s(\S+)\s+(left|joined)\s+the\s+game$/;
      if (playerAction.test(data)) {
        const [,playerName, action] = data.match(playerAction);
        if (action === "joined") done({
          connectTime: new Date(),
          playerName,
        });
      }
    },
  },
  {
    name: "playerDisconnect",
    callback(data, done) {
      const playerAction = /^.*\[.*\]\s(\S+)\s+(left|joined)\s+the\s+game$/;
      if (playerAction.test(data)) {
        const [,playerName, action] = data.match(playerAction);
        if (action === "left") done({
          connectTime: new Date(),
          playerName,
        });
      }
    },
  },
];

export async function installServer(version: string|boolean) {
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  return platformManeger.powernukkit.find(version).then(release => saveFile(release.url, {filePath: jarPath}).then(() => release));
}

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean}) {
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
    "-Daikars.new.flags=true"
  ];
  if (Config) {
    if (Config.maxFreeMemory) {
      const safeFree = Math.floor(os.freemem()/1e6)-512;
      if (safeFree > 1000) args.push(`-Xms${safeFree}m`);
      else console.warn("There is little ram available!")
    } else {
      if (Config.minMemory) args.push(`-Xms${Config.minMemory}m`);
      if (Config.maxMemory) args.push(`-Xmx${Config.maxMemory}m`);
    }
  }
  args.push("-jar", jarPath, "--language", "eng");
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_pwnukkit_${process.platform}_${process.arch}.stdout.log`);
  return new actions({command: "java", args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}}, serverConfig);
}
