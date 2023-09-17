import { extendsFS } from "@sirherobrine23/extends";
import http from "@sirherobrine23/http";
import got from "got";
import fs from "node:fs";
import path from "node:path";
import streamUtils from "node:stream/promises";
import tar from "tar";
import { spawn } from "./child.js";

export interface bedrockInfo {
  date: Date,
  release?: "oficial" | "preview",
  url: {
    [platform in NodeJS.Platform]?: {
      [arch in NodeJS.Architecture]?: {
        [ext in "tgz" | "zip"]?: string;
      }
    }
  }
}

export interface javaInfo {
  URL: string;
  releaseDate: Date;
  release: "oficial" | "snapshot" | "beta" | "alpha";
}

export const bedrockCache = new Map<string, bedrockInfo>();
export const javaCache = new Map<string, javaInfo>();

async function PromiseSplit<T extends (any[])>(arrayInput: T, fn: (value: T[number]) => any): Promise<Awaited<ReturnType<typeof fn>>[]> {
  const backup = ([]).concat(...arrayInput);
  let i = arrayInput.length, b = 1; while (i > 2) { b++; i /= 2 };
  const arraySplit = Math.max(2, Math.floor(b));
  let result: Awaited<ReturnType<typeof fn>>[] = [];
  await Promise.all(Array(arraySplit).fill(async function call() {
    return Promise.resolve().then(() => backup.length > 0 ? fn(backup.shift()) : null).then(data => {
      result.push(data);
      if (backup.length > 0) return call();
      return null;
    });
  }).map(a => a()));
  return result.flat(1);
}

/**
 * Update cache versions to Bedrock and Java server
 */
export async function updateVersions() {
  await Promise.all([
    (async () => {
      const versions = await http.jsonRequestBody<({version: string} & bedrockInfo)[]>("https://raw.githubusercontent.com/Sirherobrine23/BedrockFetch/main/versions/all.json");
      versions.filter(ver => !(bedrockCache.has(ver.version))).forEach(rel => bedrockCache.set(rel.version, {
        date: new Date(rel.date),
        release: rel.release,
        url: rel.url
      }));
    })(),
    (async () => {
      const versions = (await http.jsonRequestBody<{ versions: { id: string, releaseTime: string, url: string, type: "snapshot" | "release" | "old_beta" | "old_alpha" }[] }>("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json")).versions;
      return PromiseSplit(versions, async version => {
        if (javaCache.has(version.id)) return;
        const { downloads: { server } } = await http.jsonRequestBody<{ downloads: { server?: { url: string } } }>(version.url);
        if (!server) return;
        javaCache.set(version.id, {
          release: version.type === "release" ? "oficial" : version.type === "snapshot" ? "snapshot" : version.type === "old_beta" ? "beta" : "alpha",
          releaseDate: new Date(version.releaseTime),
          URL: server.url,
        });
      });
    })()
  ]);
}

export async function installServer(version: string, platform: "java"|"bedrock", serverPath: string) {
  if (!(platform === "bedrock" || platform === "java")) throw new Error("Require platform (java or bedrock)");
  if (platform === "java") {
    if (!(javaCache.has(version))) throw new Error("version not found for java");
    const info = javaCache.get(version);
    if (!(await extendsFS.exists(serverPath))) await fs.promises.mkdir(serverPath, { recursive: true });
    await streamUtils.pipeline(got(info.URL, { isStream: true }), fs.createWriteStream(path.resolve(serverPath, "server.jar")));
    return info;
  }
  if (!(bedrockCache.has(version))) throw new Error("version not found for bedrock");
  const info = bedrockCache.get(version);
  const fileUrl = ((info.url[process.platform === "android" ? "linux" : process.platform]||{}).x64||{}).tgz;
  if (!(await extendsFS.exists(serverPath))) await fs.promises.mkdir(serverPath, { recursive: true });
  await streamUtils.pipeline(got(fileUrl, { isStream: true }), tar.extract({ cwd: serverPath }));
  return info;
}

export async function startServer(serverPath: string) {
  const isJava = (await fs.promises.readdir(serverPath)).some(s => s.endsWith(".jar"));
  if (isJava) {
    return spawn("java", [
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
      "-jar", "server.jar"
    ], { cwd: serverPath });
  }
  const fileExec = path.join(serverPath, (await fs.promises.readdir(serverPath)).find(file => file.startsWith("bedrock_server")));
  if (process.platform !== "win32") await fs.promises.chmod(fileExec, 0o775);
  return spawn(fileExec);
}

console.info("Update versions");
await updateVersions();
console.info("Install %O", "1.20.15.01");
await installServer("1.20.15.01", "bedrock", path.join(process.cwd(), "tmpserver"));
console.info("Starting %O", "1.20.15.01");
const server = (await startServer(path.join(process.cwd(), "tmpserver")));
server.once("exit", code => process.exit(code));
process.stdin.pipe(server);
server.pipe(process.stdout);