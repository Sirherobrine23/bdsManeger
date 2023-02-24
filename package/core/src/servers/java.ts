import { manegerOptions, serverManeger } from "../serverManeger.js";
import coreHttp from "@sirherobrine23/http";
import { oracleStorage } from "../internal.js";
import { pipeline } from "node:stream/promises";
import utils from "node:util";
import path from "node:path";
import fs from "node:fs";
import semver from "semver";

export type javaOptions = manegerOptions & {
  /**
   * Servidor alternativo ao invés do servidor ofical da Mojang
   */
  altServer?: "spigot"|"paper"|"purpur"
};

export async function listVersions(options: Omit<javaOptions, keyof manegerOptions>) {
  if (options.altServer === "purpur") {
    return (await Promise.all((await coreHttp.jsonRequest<{versions: string[]}>("https://api.purpurmc.org/v2/purpur")).body.versions.map(async version => ({
      version,
      getFile: async () => coreHttp.streamRequest(utils.format("https://api.purpurmc.org/v2/purpur/%s/latest/download", version)),
      date: new Date((await coreHttp.jsonRequest<{timestamp: number}>(utils.format("https://api.purpurmc.org/v2/purpur/%s/latest", version))).body.timestamp)
    })))).sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
  } else if (options.altServer === "paper") {
    return (await Promise.all((await coreHttp.jsonRequest<{versions: string[]}>("https://api.papermc.io/v2/projects/paper")).body.versions.map(async version => {
      const build = (await coreHttp.jsonRequest<{builds: number[]}>(utils.format("https://api.papermc.io/v2/projects/paper/versions/%s", version))).body.builds.at(-1);
      const data = (await coreHttp.jsonRequest<{time: string, downloads: {[k: string]: {name: string, sha256: string}}}>(utils.format("https://api.papermc.io/v2/projects/paper/versions/%s/builds/%s", version, build))).body;

      return {
        version,
        date: new Date(data.time),
        getFile: async () => coreHttp.streamRequest(utils.format("https://api.papermc.io/v2/projects/paper/versions/%s/builds/%s/downloads/%s", version, build, data.downloads["application"].name))
      }
    }))).sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
  } else if (options.altServer === "spigot") {
    return (await oracleStorage.listFiles("SpigotBuild")).filter(f => f.name.endsWith(".jar") && !f.name.includes("craftbukkit-")).map(file => ({
      getFile: file.getFile,
      version: semver.valid(semver.coerce(file.name.replace("SpigotBuild/", "").replace(".jar", ""))),
    })).sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
  }
  return (await Promise.all((await coreHttp.jsonRequest<{versions: {id: string, releaseTime: string, url: string}[]}>("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json")).body.versions.map(async data => {
    const fileURL = (await coreHttp.jsonRequest<{downloads: {[k: string]: {size: number, url: string}}}>(data.url)).body.downloads?.["server"]?.url;
    if (!fileURL) return null;
    return {
      version: data.id,
      date: new Date(data.releaseTime),
      getFile: async () => coreHttp.streamRequest(fileURL)
    };
  }))).filter(a => !!a);
}

export async function installServer(options: javaOptions & {version?: string}) {
  const serverPath = await serverManeger("java", options);
  const version = (await listVersions(options)).find(rel => (!options.version || options.version === "latest" || rel.version === options.version));
  if (!version) throw new Error("Não existe a versão informada!");
  await pipeline(await version.getFile(), fs.createWriteStream(path.join(serverPath.serverFolder, "server.jar")));
  await fs.promises.writeFile(path.join(serverPath.serverFolder, "eula.txt"), "eula=true\n");
  return {
    id: serverPath.id,
    version: version.version,
  };
}

export async function startServer(options: javaOptions) {
  const serverPath = await serverManeger("java", options);

  // Fix to no interactive setup
  const extraArgs = [];
  if (options.altServer === "purpur") {} else if (options.altServer === "paper") {}

  return serverPath.runCommand({
    command: "java",
    args: [
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
      // Save world in worlds folder
      "--nogui", "--universe", "worlds",
      ...extraArgs,
    ],
    paths: serverPath,
    serverActions: {
      stop() {
        this.sendCommand("stop");
      },
    }
  });
}
