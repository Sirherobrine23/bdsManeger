import * as path from "node:path";
import * as fsOld from "node:fs";
import * as fs from "node:fs/promises";
import { serverRoot, logRoot } from './pathControl';
import { exec } from "./childPromisses";
import { actions, actionConfig } from './globalPlatfroms';
import { platformManeger } from "@the-bds-maneger/server_versions";
export const serverPath = path.join(serverRoot, "power_nukkit");
const jarPath = path.join(serverPath, "pwnukkit.jar");

export const portListen = /Opening\s+server\s+on\s+(([A-Za-z0-9:\.]+):([0-9]+))/;
// 14:19:28 [INFO ] Sirherobrine joined the game
// 14:25:10 [INFO ] Sirherobrine left the game
export const playerAction = /^.*\[.*\]\s(\S+)\s+(left|joined)\s+the\s+game$/;

const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run: (child) => child.writeStdin("stop")
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
      if (playerAction.test(data)) {
        const [,playerName, action] = data.match(playerAction);
        if (action === "joined") done({
          connectTime: new Date(),
          playerName,
        })
      }
    },
  },
  {
    name: "playerDisconnect",
    callback(data, done) {
      if (playerAction.test(data)) {
        const [,playerName, action] = data.match(playerAction);
        if (action === "left") done({
          connectTime: new Date(),
          playerName,
        })
      }
    },
  },
];

export async function installServer(version: string|boolean) {
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await fs.writeFile(jarPath, await platformManeger.powernukkit.getJar(version))
}

export async function startServer(Config?: {maxMemory?: number, minMemory?: number}) {
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
    if (Config?.minMemory) args.push(`-Xms${Config?.minMemory}m`);
    if (Config?.maxMemory) args.push(`-Xmx${Config?.maxMemory}m`);
  }
  args.push("-jar", jarPath, "--language", "eng");
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_pwnukkit_${process.platform}_${process.arch}.stdout.log`);
  return new actions(exec("java", args, {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}), serverConfig);
}