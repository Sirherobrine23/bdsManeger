import fsOld, { promises as fs } from "node:fs";
import coreHttp, { Github } from "@sirherobrine23/http";
import { manegerOptions, runOptions, serverManeger, serverManegerV1 } from "../serverManeger.js";
import { oracleStorage } from "../internal.js";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import extendsFS, { promiseChildProcess } from "@sirherobrine23/extends";
import semver from "semver";
import unzip from "unzip-stream";
import utils from "node:util";
import path from "node:path";
import tar from "tar";

export type bedrockOptions = manegerOptions & {
  /**
   * Servidor alternativo ao invés do servidor ofical da Mojang
   */
  altServer?: "pocketmine"|"powernukkit"|"nukkit"|"cloudbust",
};

const pocketmineGithub = await Github.repositoryManeger("pmmp", "PocketMine-MP");
export type bedrockList = {
  date: Date,
  version: string,
  release: "preview"|"stable",
  downloads: {
    php?: {
      installPHP(serverPath: serverManegerV1): Promise<void>,
    },
    server: {
      getServer(): Promise<Readable>,
      url?: string,
      urls?: {
        [platform in NodeJS.Platform]?: {
          [arch in NodeJS.Architecture]?: string
        }
      }
      [K: string]: any
    }
  }
};

/**
 * List Minecrft bedrock server versions
 *
 * @param altServer - Alternative server of official Mojang
 * @returns
 */
export async function listVersions(altServer?: bedrockOptions["altServer"]): Promise<bedrockList[]> {
  if (altServer) if (!(["cloudbust", "cloudbust", "nukkit", "pocketmine", "powernukkit"]).includes(altServer)) throw new TypeError("Invalid alt server");
  if (altServer === "pocketmine") {
    return (await pocketmineGithub.release.getRelease()).filter(rel => (rel.assets.find(assert => assert.name.endsWith(".phar")) ?? {}).browser_download_url).map(rel => ({
      date: new Date(rel.created_at),
      version: rel.tag_name,
      release: rel.prerelease ? "preview" : "stable",
      downloads: {
        php: {
          async installPHP(serverPath: serverManegerV1) {
            const phpFile = (await oracleStorage.listFiles("php_bin")).find(file => file.name.includes(process.platform) && file.name.includes(process.arch));
            if (!phpFile) throw new Error(`Unable to find php files for ${process.platform} with architecture ${process.arch}`);
            if (phpFile.name.endsWith(".tar.gz")||phpFile.name.endsWith(".tgz")||phpFile.name.endsWith(".tar")) await pipeline(oracleStorage.getFile(phpFile.name), tar.extract({cwd: serverPath.serverFolder}));
            else if (phpFile.name.endsWith(".zip")) await pipeline(oracleStorage.getFile(phpFile.name), unzip.Extract({path: serverPath.serverFolder}));
            else throw new Error("Found file is not supported!");
            return null
          },
        },
        server: {
          url: (rel.assets.find(assert => assert.name.endsWith(".phar")) ?? {}).browser_download_url,
          async getServer() {
            const pharFile = rel.assets.find(assert => assert.name.endsWith(".phar"));
            if (!pharFile) throw new Error("Version not includes server file!");
            return coreHttp.streamRequest(pharFile.browser_download_url);
          }
        }
      }
    }));
  } else if (altServer === "powernukkit") {
    const releases_version = (await coreHttp.jsonRequest<{[k: string]: {version: string, releaseTime: number, minecraftVersion: string, artefacts: string[], commitId:  string, snapshotBuild?: number}[]}>("https://raw.githubusercontent.com/PowerNukkit/powernukkit-version-aggregator/master/powernukkit-versions.json")).body;
    return Object.keys(releases_version).reduce((acc, key) => acc.concat(releases_version[key]), [] as (typeof releases_version)[string]).map(data => {
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
      return {
        date: dt,
        version: data.version,
        release: data.snapshotBuild ? "stable" : "preview",
        downloads: {
          server: {
            mcpeVersion: data.minecraftVersion,
            url: artefacts.SHADED_JAR || artefacts.REDUCED_JAR,
            async getServer() {
              if (!(artefacts.SHADED_JAR || artefacts.REDUCED_JAR)) throw new Error("Cannot get server file to the version!");
              return coreHttp.streamRequest(artefacts.SHADED_JAR || artefacts.REDUCED_JAR)
            },
          }
        }
      };
    });
  } else if (altServer === "cloudbust"||altServer === "nukkit") {
    const { body: { jobs } } = await coreHttp.jsonRequest<{jobs: {name: string, _class: string}[]}>(`https://ci.opencollab.dev/job/NukkitX/job/${altServer === "nukkit" ? "Nukkit" : "Server"}/api/json`);
    const buildFiles = await Promise.all(jobs.filter(b => b._class === "org.jenkinsci.plugins.workflow.job.WorkflowJob").map(b => b.name).map(async branch => {
      const { body: { builds } } = await coreHttp.jsonRequest<{builds: {_class: string, number: number, url: string}[]}>(`https://ci.opencollab.dev/job/NukkitX/job/${altServer === "nukkit" ? "Nukkit" : "Server"}/job/${branch}/api/json`);
      return Promise.all(builds.map(async build => {
        const { body: { artifacts, result, timestamp } } = await coreHttp.jsonRequest<{result: "SUCCESS", timestamp: number, artifacts: {displayPath: string, fileName: string, relativePath: string}[]}>(`https://ci.opencollab.dev/job/NukkitX/job/${altServer === "nukkit" ? "Nukkit" : "Server"}/job/${branch}/${build.number}/api/json`);
        if (result !== "SUCCESS") return [];
        return artifacts.filter(f => f.relativePath.endsWith(".jar")).map(target => ({
          buildNumber: build.number,
          branch,
          releaseDate: new Date(timestamp),
          url: `https://ci.opencollab.dev/job/NukkitX/job/${altServer === "nukkit" ? "Nukkit" : "Server"}/job/${branch}/${build.number}/artifact/${target.relativePath}`,
        }));
      }));
    })).then(r => r.flat(2));
    return buildFiles.sort((b, a) => a.releaseDate.getTime() - b.releaseDate.getTime()).map(rel => ({
      date: rel.releaseDate,
      release: "preview",
      version: `${rel.branch}_${rel.buildNumber}`,
      downloads: {
        server: {
          url: rel.url,
          async getServer() {
            return coreHttp.streamRequest(rel.url);
          },
        }
      }
    }));
  }
  return (await coreHttp.jsonRequest<{version: string, date: Date, release?: "stable"|"preview", url: {[platform in NodeJS.Platform]?: {[arch in NodeJS.Architecture]?: string}}}[]>("https://sirherobrine23.github.io/BedrockFetch/all.json")).body.sort((b, a) => semver.compare(semver.valid(semver.coerce(a.version)), semver.valid(semver.coerce(b.version)))).map(rel => ({
    version: rel.version,
    date: new Date(rel.date),
    release: rel.release === "preview" ? "preview" : "stable",
    downloads: {
      server: {
        url: rel.url[process.platform]?.[process.arch],
        async getServer() {
          const platformURL = (rel.url[process.platform] ?? rel.url["linux"]);
          if (!platformURL) throw new Error("Cannot get platform URL");
          const arch = platformURL[process.arch] ?? platformURL["x64"];
          if (!arch) throw new Error("Cannot get bedrock server to current arch");
          return coreHttp.streamRequest(arch);
        },
        urls: rel.url
      }
    }
  }));
}

export async function installServer(options: bedrockOptions & {version?: string, allowBeta?: boolean}) {
  const serverPath = await serverManeger("bedrock", options);
  const versions = await listVersions(options?.altServer);
  if (options.altServer === "pocketmine") {
    const rel = options.version === "latest" ? versions.at(0) : versions.find(rel => rel.version === options.version);
    if (!rel) throw new Error("Version not exsists");
    await rel.downloads.php.installPHP(serverPath);
    await pipeline(await rel.downloads.server.getServer(), fsOld.createWriteStream(path.join(serverPath.serverFolder, "server.phar")));
    return {
      ...rel,
      id: serverPath.id,
    };
  } else if (options.altServer === "cloudbust" || options.altServer === "powernukkit" || options.altServer === "nukkit") {
    if ((["cloudbust", "nukkit"]).includes(options.altServer)) options.version = "latest";
    const rel = options.version === "latest" ? versions.at(0) : versions.find(rel => rel.version === options.version);
    if (!rel) throw new Error("Version not exists");
    await pipeline(await rel.downloads.server.getServer(), fsOld.createWriteStream(path.join(serverPath.serverFolder, "server.jar")));
    return {
      ...rel,
      id: serverPath.id,
    };
  }
  const bedrockVersion = versions.find(rel => {
    if (rel.release === "preview") if (options.allowBeta !== true) return false;
    const version = (options.version ?? "latest").trim();
    if (version.toLowerCase() === "latest") return true;
    return rel.version === version;
  });
  if (!bedrockVersion) throw new Error("Não existe essa versão");
  let downloadUrl = bedrockVersion.downloads.server.url;
  if ((["android", "linux"] as NodeJS.Process["platform"][]).includes(process.platform) && process.arch !== "x64") {
    if (!downloadUrl) {
      for (const emu of ["qemu-x86_64-static", "qemu-x86_64", "box64"]) {
        if (downloadUrl) break;
        if (await promiseChildProcess.commandExists(emu)) downloadUrl = bedrockVersion.downloads.server.urls.linux?.x64;
      }
    }
  }
  if (!downloadUrl) throw new Error(`Não existe o URL de download para ${process.platform} na arquitetura ${process.arch}`);

  const filesBackup = ["server.properties", "valid_known_packs.json", "permissions.json", "allowlist.json", "whitelist.json"];
  const datS = (await Promise.all(filesBackup.map(async f => !await extendsFS.exists(path.join(serverPath.serverFolder, f)) ? null : ({path: f, data: await fs.readFile(path.join(serverPath.serverFolder, f))})))).filter(a => !!a);
  await pipeline(await coreHttp.streamRequest(downloadUrl), unzip.Extract({path: serverPath.serverFolder}));
  await Promise.all(datS.map(async f => fs.writeFile(f.path, f.data)));
  return {
    ...bedrockVersion,
    id: serverPath.id,
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
      stop() {
        this.sendCommand("stop");
      },
      portListen(lineString) {
        // [INFO] IPv4 supported, port: 19132
        // [2023-03-08 13:01:57 INFO] Listening on IPv4 port: 19132
        const ipProtocol = lineString.slice(lineString.indexOf("IPv"), lineString.indexOf("IPv")+4);
        if (ipProtocol) {
          let port = lineString.slice(lineString.lastIndexOf("port:")+5).trim();
          if (port.indexOf(":") !== -1) port = port.slice(0, port.lastIndexOf(":"));
          return {
            protocol: "UDP",
            listenOn: ipProtocol.toLowerCase() === "ipv4" ? "0.0.0.0" : "[::]",
            port: Number(port),
          };
        }
        return null;
      },
      playerAction(lineString) {
        lineString = lineString.replace(/^(.*)?\[.*\]/, "").trim();
        if (lineString.startsWith("Player")) {
          lineString = lineString.replace("Player", "").trim();

          // Spawned, disconnected, connected
          let action: string;
          if (lineString.startsWith("Spawned")) action = "Spawned";
          else if (lineString.startsWith("disconnected")) action = "disconnected";
          else if (lineString.startsWith("connected")) action = "connected";
          if (!action) return null;
          lineString = lineString.replace(action, "").trim();
          if (lineString.startsWith(":")) lineString = lineString.slice(1).trim();

          let playerName = lineString.substring(0, lineString.indexOf("xuid:")-1).trim();
          if (!playerName) return null;
          if (playerName.endsWith(",")) playerName = playerName.slice(0, playerName.length - 1);

          let xuid: string;
          if (lineString.indexOf("xuid:") !== -1) {
            xuid = lineString.slice(lineString.indexOf("xuid:")+5).trim();
            if (!xuid) xuid = null;
          }

          return {
            onDate: new Date(),
            action,
            playerName,
            extra: {
              xuid
            }
          };
        };
        return null;
      },
      onAvaible(data) {
        // [2023-03-06 21:37:27:699 INFO] Server started.
        data = data.replace(/^.*?\[.*\]/, "").trim();
        if (data.includes("started") && data.includes("Server")) return new Date();
        return null
      },
      postStart: [
        async function() {
          let breaked = false;
          this.once("close", () => breaked = true);
          let w: any;
          this.once("close", () => w.close());
          while(true) {
            if (breaked) break;
            await new Promise(done => {
              this.once("close", done);
              w = fsOld.watch(this.runOptions.paths.serverFolder, {recursive: true}, () => {w.close(); done(null);}).on("error", () => {});
            });
            await new Promise(done => setTimeout(done, 1000));
            const cDate = new Date();
            const month = String(cDate.getMonth()+1 > 9 ? cDate.getMonth()+1 : "0"+(cDate.getMonth()+1).toString());
            const day = String(cDate.getDate() > 9 ? cDate.getDate() : "0"+((cDate.getDate()).toString()));
            const backupFile = path.join(this.runOptions.paths.backup, "hotBackup", String(cDate.getFullYear()), month, day, `${cDate.getHours()}_${cDate.getMinutes()}.tgz`);
            if (!(await extendsFS.exists(path.dirname(backupFile)))) await fs.mkdir(path.dirname(backupFile), {recursive: true});
            const ff = (await fs.readdir(this.runOptions.paths.serverFolder)).filter(ff => {
              let ok = ff.endsWith(".json");
              if (!ok) ok = ff === "server.properties";
              if (!ok) ok = ff === "worlds";
              return ok;
            });
            const hotTar = tar.create({
              gzip: true,
              cwd: this.runOptions.paths.serverFolder,
              prefix: ""
            }, ff);
            this.emit("hotBackup", hotTar);
            await pipeline(hotTar, fsOld.createWriteStream(backupFile));
          }
        }
      ]
    }
  };
  if ((["android", "linux"] as NodeJS.Process["platform"][]).includes(process.platform) && process.arch !== "x64") {
    for (const emu of ["qemu-x86_64-static", "qemu-x86_64", "box64"]) {
      if (await promiseChildProcess.commandExists(emu)) {
        run.args = [run.command, ...run.args];
        run.command = emu;
        break;
      }
    }
  }
  return serverPath.runCommand(run);
}