import coreHttp, { Github, large } from "@sirherobrine23/http";
import { manegerOptions, runOptions, serverManeger } from "../serverManeger.js";
import { createWriteStream } from "node:fs";
import { commandExists } from "../childPromisses.js";
import { oracleStorage } from "../internal.js";
import { pipeline } from "node:stream/promises";
import { readdir } from "node:fs/promises";
import extendsFS from "@sirherobrine23/extends";
import semver from "semver";
import unzip from "unzip-stream";
import utils from "node:util";
import path from "node:path";
import tar from "tar";

export type bedrockOptions = manegerOptions & {
  /**
   * Servidor alternativo ao invés do servidor ofical da Mojang
   */
  altServer?: "pocketmine"|"powernukkit"|"cloudbust",
};

const pocketmineGithub = await Github.GithubManeger("pmmp", "PocketMine-MP");

export async function listVersions(options: {altServer: "powernukkit"} & Omit<bedrockOptions, "altServer"|keyof manegerOptions>): Promise<{version: string, mcpeVersion: string, date: Date, variantType: "stable"|"snapshot", url: string}[]>;
export async function listVersions(options: {altServer: "pocketmine"} & Omit<bedrockOptions, "altServer"|keyof manegerOptions>): Promise<Github.githubRelease[]>;
export async function listVersions(): Promise<{version: string, date: Date, release?: "stable"|"preview", url: {[platform in NodeJS.Platform]?: {[arch in NodeJS.Architecture]?: string}}}[]>;
export async function listVersions(options?: Omit<bedrockOptions, keyof manegerOptions>) {
  if (!options) options = {};
  if (options.altServer === "pocketmine") return pocketmineGithub.getRelease();
  else if (options.altServer === "powernukkit") {
    const releases_version = (await coreHttp.jsonRequest<{[k: string]: {version: string, releaseTime: number, minecraftVersion: string, artefacts: string[], commitId:  string, snapshotBuild?: number}[]}>("https://raw.githubusercontent.com/PowerNukkit/powernukkit-version-aggregator/master/powernukkit-versions.json")).body;
    return Object.keys(releases_version).reduce((acc, key) => {
      for (const data of releases_version[key]) {
        const dt = new Date(data.releaseTime);
        const getArtefactExtension = (artefactId: string) => (artefactId.includes("REDUCED_JAR")) ? ".jar" : (artefactId.includes("REDUCED_SOURCES_JAR")) ? "-sources.jar" : (artefactId.includes("SHADED_JAR")) ? "-shaded.jar" : (artefactId.includes("SHADED_SOURCES_JAR")) ? "-shaded-sources.jar" : (artefactId.includes("JAVADOC_JAR")) ? "-javadoc.jar" : ".unknown";
        function buildArtefactUrl(data: any, artefactId?: string) {
          const buildReleaseArtefactUrl = (data: any, artefactId?: string) => !data.artefacts.includes(artefactId) ? null : utils.format("https://search.maven.org/remotecontent?filepath=org/powernukkit/powernukkit/%s/powernukkit-%s%s", data.version, data.version, getArtefactExtension(artefactId));
          const buildSnapshotArtefactUrl = (data: any, artefactId?: string) => !data.artefacts.includes(artefactId) ? null : utils.format("https://oss.sonatype.org/content/repositories/snapshots/org/powernukkit/powernukkit/%s-SNAPSHOT/powernukkit-%s-%s%s", data.version.substring(0, data.version.indexOf("-SNAPSHOT")), data.version.substring(0, data.version.indexOf("-SNAPSHOT")), dt.getUTCFullYear().toString().padStart(4, "0") + (dt.getUTCMonth() + 1).toString().padStart(2, "0") + dt.getUTCDate().toString().padStart(2, "0") + "." + dt.getUTCHours().toString().padStart(2, "0") + dt.getUTCMinutes().toString().padStart(2, "0") + dt.getUTCSeconds().toString().padStart(2, "0") + "-" + data.snapshotBuild, getArtefactExtension(artefactId));
          if (artefactId == "GIT_SOURCE") {
            if (data.commitId) return utils.format("https://github.com/PowerNukkit/PowerNukkit/tree/%s", data.commitId);
            else if (data.snapshotBuild && data.artefacts.includes("SHADED_SOURCES_JAR")) return buildSnapshotArtefactUrl(data, "SHADED_SOURCES_JAR");
            else if (data.snapshotBuild && data.artefacts.includes("REDUCED_SOURCES_JAR")) return buildSnapshotArtefactUrl(data, "REDUCED_SOURCES_JAR");
            else if (data.artefacts.includes("SHADED_SOURCES_JAR")) return buildReleaseArtefactUrl(data, "SHADED_SOURCES_JAR");
            else if (data.artefacts.includes("REDUCED_SOURCES_JAR")) return buildReleaseArtefactUrl(data, "REDUCED_SOURCES_JAR");
          } else if (data.snapshotBuild) return buildSnapshotArtefactUrl(data, artefactId);
          else return buildReleaseArtefactUrl(data, artefactId);
          return null;
        }
        const artefacts = data.artefacts.reduce((acc, artefactId) => {acc[artefactId] = buildArtefactUrl(data, artefactId); return acc;}, {} as {[key: string]: string});
        const verRel = {
          version: data.version,
          mcpeVersion: data.minecraftVersion,
          date: dt,
          variantType: (!data.snapshotBuild?"snapshot":"stable") as "stable"|"snapshot",
          url: artefacts.SHADED_JAR || artefacts.REDUCED_JAR
        };
        if (!!verRel.url) acc.push(verRel);
      }
      return acc;
    }, [] as {version: string, mcpeVersion: string, date: Date, variantType: "stable"|"snapshot", url: string}[]).filter(a => !!a.url).sort((b, a) => (b.date.getTime() - a.date.getTime()) - semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
  } else if (options.altServer === "cloudbust") throw new TypeError("O Cloudbust não tem listagem de versöes");
  return (await coreHttp.jsonRequest<{version: string, date: Date, release?: "stable"|"preview", url: {[platform in NodeJS.Platform]?: {[arch in NodeJS.Architecture]?: string}}}[]>("https://sirherobrine23.github.io/BedrockFetch/all.json")).body.sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version))));
}

export async function installServer(options: bedrockOptions & {version?: string, allowBeta?: boolean}): Promise<{id: string, version: string, mcpeVersion?: string, releaseDate: Date}> {
  const serverPath = await serverManeger("bedrock", options);
  if (options.altServer === "pocketmine") {
    const version = (options.version || "latest").trim();
    const rel = await pocketmineGithub.getRelease(version === "latest" ? true : version);
    let fileURL: string;
    if (!(fileURL = rel?.assets?.find(a => a.name.endsWith(".phar"))?.browser_download_url)) throw new Error("Não foi possivel encontrar a versão informada do Pocketmine!");

    const phpFile = (await oracleStorage.listFiles("php_bin")).find(file => file.name.includes(process.platform) && file.name.includes(process.arch));
    if (!phpFile) throw new Error(`Não foi possivel encontra os arquivos do php para o ${process.platform} com a arquitetura ${process.arch}`);
    if (phpFile.name.endsWith(".tar.gz")||phpFile.name.endsWith(".tgz")||phpFile.name.endsWith(".tar")) await pipeline(await oracleStorage.getFileStream(phpFile.name), tar.extract({cwd: serverPath.serverFolder}));
    else if (phpFile.name.endsWith(".zip")) await pipeline(await oracleStorage.getFileStream(phpFile.name), unzip.Extract({path: serverPath.serverFolder}));
    else throw new Error("Arquivo encontrado não é suportado!");

    // save phar
    await large.saveFile({
      url: fileURL,
      path: path.join(serverPath.serverFolder, "server.phar")
    });

    return {
      id: serverPath.id,
      version: rel.tag_name,
      releaseDate: new Date(rel.published_at)
    };
  } else if (options.altServer === "powernukkit") {
    const version = (options.version ?? "latest").trim();
    const releases = await listVersions({altServer: "powernukkit"});
    const relVersion = releases.find(rel => {
      if (rel.variantType === "snapshot") if (!options.allowBeta) return false;
      if (version.toLowerCase() === "latest") return true;
      return (rel.version === version || rel.mcpeVersion === version);
    });
    if (!relVersion) throw new Error("A versão não foi encontrada, por favor verique a versão informada!");
    await large.saveFile({
      path: path.join(serverPath.serverFolder, "server.jar"),
      url: relVersion.url
    });
    return {
      id: serverPath.id,
      version: relVersion.version,
      mcpeVersion: relVersion.mcpeVersion,
      releaseDate: relVersion.date,
    };
  } else if (options.altServer === "cloudbust") {
    await large.saveFile({
      url: "https://ci.opencollab.dev/job/NukkitX/job/Server/job/bleeding/lastSuccessfulBuild/artifact/target/Cloudburst.jar",
      path: path.join(serverPath.serverFolder, "server.jar")
    });

    return {
      id: serverPath.id,
      version: "bleeding",
      releaseDate: new Date()
    };
  }
  const bedrockVersion = (await listVersions()).find(rel => {
    if (rel.release === "preview" && !!options.allowBeta) return false;
    const version = (options.version ?? "latest").trim();
    if (version.toLowerCase() === "latest") return true;
    return rel.version === version;
  });
  if (!bedrockVersion) throw new Error("Não existe essa versão");
  let downloadUrl = bedrockVersion.url[process.platform]?.[process.arch];
  if ((["android", "linux"] as NodeJS.Process["platform"][]).includes(process.platform) && process.arch !== "x64") {
    if (!downloadUrl) {
      for (const emu of ["qemu-x86_64-static", "qemu-x86_64", "box64"]) {
        if (downloadUrl) break;
        if (await commandExists(emu)) downloadUrl = bedrockVersion.url.linux?.x64;
      }
    }
  }
  if (!downloadUrl) throw new Error(`Não existe o URL de download para ${process.platform} na arquitetura ${process.arch}`);
  await pipeline(await coreHttp.streamRequest(downloadUrl), unzip.Extract({path: serverPath.serverFolder}));
  return {
    id: serverPath.id,
    version: bedrockVersion.version,
    releaseDate: bedrockVersion.date,
  };
}

export async function startServer(options: bedrockOptions) {
  const serverPath = await serverManeger("bedrock", options);
  if (options.altServer === "powernukkit"||options.altServer === "cloudbust") {
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
      ],
      paths: serverPath,
      serverActions: {
        stop() {
          this.sendCommand("stop");
        },
      }
    })
  } else if (options.altServer === "pocketmine") {
    return serverPath.runCommand({
      command: (await extendsFS.readdir(serverPath.serverFolder)).find(file => file.endsWith("php")||file.endsWith("php.exe")),
      args: [
        "server.phar",
        "--no-wizard"
      ],
      paths: serverPath,
      serverActions: {
        stop() {
          this.sendCommand("stop")
        },
      }
    });
  }
  if (process.platform === "darwin") throw new Error("Run in docker or podman!");
  const run: Omit<runOptions, "cwd"> = {
    command: path.join(serverPath.serverFolder, "bedrock_server"),
    paths: serverPath,
    serverActions: {
      postStop: {
        async createBackup() {
          const currentDate = new Date();
          return pipeline(tar.create({
            gzip: true,
            cwd: this.runOptions.paths.serverFolder,
            prefix: ""
          }, await readdir(this.runOptions.paths.serverFolder)), createWriteStream(path.join(this.runOptions.paths.backup, String(currentDate.getTime())+".tgz")));
        },
      },
      stop() {
        this.sendCommand("stop");
      },
      portListen(lineString) {
        // [INFO] IPv4 supported, port: 19132
        lineString = lineString.replace(/^(.*)?\[.*\]/, "").trim();
        if (lineString.startsWith("IPv")) {
          return {
            protocol: "UDP",
            listenOn: lineString.startsWith("IPv4") ? "0.0.0.0" : "[::]",
            port: Number(lineString.substring(lineString.indexOf("port: ")+6).replace(/:.*$/, "")),
          };
        }
        // NO LOG FILE! - [2023-02-23 21:09:52 INFO] Listening on IPv4 port: 19132
        else if (lineString.startsWith("Listening")) {
          lineString = lineString.substring(lineString.indexOf("IPv")-3);
          return {
            protocol: "UDP",
            listenOn: lineString.startsWith("IPv4") ? "0.0.0.0" : "[::]",
            port: Number(lineString.substring(lineString.indexOf("port: ")+6).replace(/:.*$/, "")),
          };
        }
        return null;
      },
    }
  };
  if ((["android", "linux"] as NodeJS.Process["platform"][]).includes(process.platform) && process.arch !== "x64") {
    for (const emu of ["qemu-x86_64-static", "qemu-x86_64", "box64"]) {
      if (await commandExists(emu)) {
        run.args = [run.command, ...run.args];
        run.command = emu;
        break;
      }
    }
  }
  return serverPath.runCommand(run);
}