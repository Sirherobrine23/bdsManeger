import { manegerOptions, serverManeger } from "../serverManeger.js";
import { oracleStorage } from "../internal.js";
import { extendsFS } from "@sirherobrine23/extends";
import { pipeline } from "node:stream/promises";
import coreHttp, { Github } from "@sirherobrine23/http";
import semver from "semver";
import stream from "node:stream";
import utils from "node:util";
import path from "node:path";
import fs from "node:fs";

export type javaOptions = manegerOptions & {
  /**
   * Alternative server instead of official Mojang server
   */
  altServer?: "spigot"|"paper"|"purpur"|"glowstone"|"folia"|"cuberite"
};

export type javaList = {
  version: string,
  release: "stable"|"snapshot",
  date?: Date,
  platform?: NodeJS.Platform;
  architecture?: NodeJS.Architecture;
  getFile: {
    fileName: string;
    stream(): Promise<stream.Readable>;
    fileURL?: string;
  }[],
};

export async function listVersions(altServer?: javaOptions["altServer"]): Promise<javaList[]> {
  if (altServer) if(!(["paper", "folia", "purpur", "spigot", "glowstone", "cuberite"]).includes(altServer)) throw new TypeError("Invalid alt server!");
  if (altServer === "purpur") {
    return (await Promise.all((await coreHttp.jsonRequest<{versions: string[]}>("https://api.purpurmc.org/v2/purpur")).body.versions.map(async (version): Promise<javaList> => ({
      version,
      release: "stable",
      date: new Date((await coreHttp.jsonRequest<{timestamp: number}>(utils.format("https://api.purpurmc.org/v2/purpur/%s/latest", version))).body.timestamp),
      getFile: [
        {
          fileName: "server.jar",
          fileURL: utils.format("https://api.purpurmc.org/v2/purpur/%s/latest/download", version),
          async stream() {return coreHttp.streamRequest(utils.format("https://api.purpurmc.org/v2/purpur/%s/latest/download", version));},
        }
      ],
    })))).sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
  } else if (altServer === "paper" || altServer === "folia") {
    const uriPATH = ["/v2/projects", altServer];
    return (await Promise.all((await coreHttp.jsonRequest<{versions: string[]}>(new URL(uriPATH.join("/"), "https://api.papermc.io"))).body.versions.map(async (version): Promise<javaList> => {
      const build = (await coreHttp.jsonRequest<{builds: number[]}>(new URL(uriPATH.concat(["versions", version]).join("/"), "https://api.papermc.io"))).body.builds.at(-1);
      const data = (await coreHttp.jsonRequest<{time: string, downloads: {[k: string]: {name: string, sha256: string}}}>(new URL(uriPATH.concat(["versions", version, "builds", build.toString()]).join("/"), "https://api.papermc.io"))).body;
      const fileUrl = new URL(uriPATH.concat(["versions", version, "builds", build.toString(), "downloads", data.downloads["application"].name]).join("/"), "https://api.papermc.io");
      return {
        version,
        date: new Date(data.time),
        release: "stable",
        getFile: [{
          fileURL: fileUrl.toString(),
          fileName: "server.jar",
          async stream() {return coreHttp.streamRequest(fileUrl);}
        }]
      }
    }))).sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
  } else if (altServer === "spigot") {
    const fileList = await oracleStorage.listFiles("SpigotBuild");
    return fileList.filter(f => f.name.endsWith(".jar") && !f.name.includes("craftbukkit-")).map((file): javaList => {
      let version: string;
      if (!(version = semver.valid(semver.coerce(file.name.replace("SpigotBuild/", "").replace(".jar", ""))))) return null;
      const craftBuckit = ([...fileList]).reverse().find(file => file.name.startsWith("SpigotBuild/craftbukkit-"+version) || file.name.startsWith("SpigotBuild/craftbukkit-"+(version.endsWith(".0") ? version.slice(0, -2) : version)));
      return {
        release: "stable",
        version,
        getFile: [
          ...(craftBuckit ? [{
            fileName: path.basename(craftBuckit.name),
            async stream() {
              return craftBuckit.getFile();
            },
          }] : []),
          {
            fileName: "server.jar",
            async stream() {
              return file.getFile();
            },
          },
        ],
      };
    }).filter(rel => !!rel).sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
  } else if (altServer === "glowstone") {
    const repo = await Github.repositoryManeger("GlowstoneMC", "Glowstone");
    const rels = await repo.release.getRelease();
    return rels.filter(rel => !!rel.assets.find(asset => asset.name.endsWith(".jar"))).map(rel => ({
      version: rel.tag_name,
      release: "stable",
      fileUrl: rel.assets.find(asset => asset.name.endsWith(".jar")).browser_download_url,
      getFile: [{
        fileURL: rel.assets.find(asset => asset.name.endsWith(".jar")).browser_download_url,
        fileName: "server.jar",
        async stream() {
          return coreHttp.streamRequest(rel.assets.find(asset => asset.name.endsWith(".jar")).browser_download_url);
        },
      }]
    }));
  } else if (altServer === "cuberite") {
    const buildFiles: {buildNumber: number; project: string; releaseDate: Date; url: string;}[] = [];
    for (const project of ["android", "linux-aarch64", "linux-armhf", "linux-i386", "linux-x86_64", "darwin-x86_64"]) {
      const { builds = [] } = await coreHttp.jsonRequestBody<{builds: {number: number, _class: string}[]}>(`https://builds.cuberite.org/job/${project}/api/json`);
      await Promise.all(builds.slice(0, 16).map(async job => {
        const { artifacts = [], result, timestamp } = await coreHttp.jsonRequestBody<{timestamp: number, result: string, artifacts: {relativePath: string, fileName: string}[]}>(`https://builds.cuberite.org/job/${project}/${job.number}/api/json`);
        if (result !== "SUCCESS") return;
        artifacts.filter(file => !file.fileName.endsWith(".sha1")).forEach(file => buildFiles.push({
          project,
          url: `https://builds.cuberite.org/job/${project}/${job.number}/artifact/${file.relativePath}`,
          buildNumber: job.number,
          releaseDate: new Date(timestamp),
        }));
      }));
    }
    return buildFiles.concat([
      {
        buildNumber: -1,
        project: "windows-x86_64",
        releaseDate: new Date(),
        url: "https://download.cuberite.org/windows-x86_64/Cuberite.zip",
      },
      {
        buildNumber: -1,
        project: "windows-x86",
        releaseDate: new Date(),
        url: "https://download.cuberite.org/windows-i386/Cuberite.zip",
      },
    ]).sort((b, a) => a.releaseDate.getTime() - b.releaseDate.getTime()).map(rel => ({
      date: rel.releaseDate,
      version: `${rel.project}_${rel.buildNumber}`,
      platform: rel.project.startsWith("windows") ? "win32" : rel.project.startsWith("linux") ? "linux" : rel.project.startsWith("android") ? "android" : rel.project.startsWith("darwin") ? "darwin" : undefined,
      architecture: rel.project.endsWith("x86_64") ? "x64" : rel.project.endsWith("i386") ? "ia32" : rel.project.endsWith("armhf") ? "arm" : rel.project.endsWith("aarch64") ? "arm64" : undefined,
      release: "stable",
      fileUrl: rel.url,
      getFile: [{
        fileName: "server.jar",
        async stream() {
          return coreHttp.streamRequest(rel.url);
        },
      }]
    }));
  }

  return (await Promise.all((await coreHttp.jsonRequest<{versions: {id: string, releaseTime: string, url: string, type: "snapshot"|"release"}[]}>("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json")).body.versions.map(async (data): Promise<javaList> => {
    const fileURL = (await coreHttp.jsonRequest<{downloads: {[k: string]: {size: number, url: string}}}>(data.url)).body.downloads?.["server"]?.url;
    if (!fileURL) return null;
    return {
      version: data.id,
      date: new Date(data.releaseTime),
      release: data.type === "snapshot" ? "snapshot" : "stable",
      getFile: [{
        fileName: "server.jar",
        async stream() {
          return coreHttp.streamRequest(fileURL);
        },
      }],
    };
  }))).filter(a => !!a);
}

export async function installServer(options: javaOptions & {version?: string, allowBeta?: boolean}) {
  const serverPath = await serverManeger("java", options);
  const version = (await listVersions(options.altServer)).filter(rel => rel.release === "stable" ? true : !!options.allowBeta).find(rel => (!options.version || options.version === "latest" || rel.version === options.version));
  if (!version) throw new Error("The specified version does not exist!");
  for (const file of version.getFile) await pipeline(await file.stream(), fs.createWriteStream(path.join(serverPath.serverFolder, file.fileName)));
  await fs.promises.writeFile(path.join(serverPath.serverFolder, "eula.txt"), "eula=true\n");
  return {
    id: serverPath.id,
    version: version.version,
    release: version.release,
    date: version.date,
  };
}

export async function startServer(options: javaOptions) {
  const serverPath = await serverManeger("java", options);
  // Java server
  if (await extendsFS.exists(path.join(serverPath.serverFolder, "server.jar"))) {
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
        "--nogui",
        // Save world in worlds folder
        "--universe", "worlds",
        // ...extraArgs,
      ],
      paths: serverPath,
      serverActions: {
        stop() {
          this.sendCommand("stop");
        },
        portListen(lineString) {
          // [21:19:18] [Server thread/INFO]: Starting Minecraft server on *:25565
          lineString = lineString.replace(/^.*?\[.*\]:/, "").trim();
          if (lineString.startsWith("Starting Minecraft server on")) {
            if (lineString.lastIndexOf(":") === -1) return null;
            const port = Number(lineString.slice(lineString.lastIndexOf(":")+1));
            return {
              port,
              protocol: "TCP",
              listenFrom: "server"
            };
          }
          return null;
        },
      }
    });
  }

  throw new Error("install server or check if server installed correctly!");
}
