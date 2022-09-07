import * as path from "node:path";
import * as fsOld from "node:fs";
import { serverRoot, logRoot } from './pathControl';
import { exec } from "./childPromisses";
import { actions, actionConfig } from './globalPlatfroms';
export const serverPath = path.join(serverRoot, "power_nukkit");
const jarPath = path.join(serverPath, "pwnukkit.jar");

const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run: (child) => child.writeStdin("stop")
  }
];

export async function startServer(Config?: {maxMemory?: number, minMemory?: number}) {
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const args = ["-jar", "-XX:+UseG1GC", "-XX:+ParallelRefProcEnabled", "-XX:MaxGCPauseMillis=200", "-XX:+UnlockExperimentalVMOptions", "-XX:+DisableExplicitGC", "-XX:+AlwaysPreTouch", "-XX:G1NewSizePercent=30", "-XX:G1MaxNewSizePercent=40", "-XX:G1HeapRegionSize=8M", "-XX:G1ReservePercent=20", "-XX:G1HeapWastePercent=5", "-XX:G1MixedGCCountTarget=4", "-XX:InitiatingHeapOccupancyPercent=15", "-XX:G1MixedGCLiveThresholdPercent=90", "-XX:G1RSetUpdatingPauseTimePercent=5", "-XX:SurvivorRatio=32", "-XX:+PerfDisableSharedMem", "-XX:MaxTenuringThreshold=1", "-Dusing.aikars.flags=https://mcflags.emc.gs", "-Daikars.new.flags=true"];
  if (Config) {
    if (Config?.minMemory) args.push(`-Xms${Config?.minMemory}m`);
    if (Config?.maxMemory) args.push(`-Xmx${Config?.maxMemory}m`);
  }
  args.push(jarPath);
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_pwnukkit_${process.platform}_${process.arch}.stdout.log`);
  return new actions(exec("java", args, {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}), serverConfig);
}
