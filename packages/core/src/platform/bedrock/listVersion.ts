import { http, Github } from "@sirherobrine23/http";
import { versionsStorages } from "../../serverRun.js";
import util from "node:util";
import xml from "xml-js";

export interface mojangInfo {
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

export const mojangCache = new versionsStorages<mojangInfo>();
export async function listMojang() {
  const versions = await http.jsonRequestBody<({version: string} & mojangInfo)[]>("https://raw.githubusercontent.com/Sirherobrine23/BedrockFetch/main/versions/all.json");
  versions.filter(ver => !(mojangCache.has(ver.version))).forEach(rel => mojangCache.set(rel.version, {
    date: new Date(rel.date),
    release: rel.release,
    url: rel.url
  }));
}

type powerNukkitRelease = {
  version: string;
  minecraftVersion: string;
  releaseTime: number;
  commitId: string;
  snapshotBuild?: number;
  artefacts: string[];
}

export interface powernukkitDownload {
  version: string;
  releaseDate: Date;
  releaseType: "snapshot"|"oficial";
  url: string;
}

export const powernukkitCache = new versionsStorages<powernukkitDownload>();
export async function listPowernukkitProject() {
  const releases = await http.jsonRequestBody<{[k in "releases"|"snapshots"]: powerNukkitRelease[]}>("https://raw.githubusercontent.com/PowerNukkit/powernukkit-version-aggregator/master/powernukkit-versions.json");
  const releasesData = (Object.keys(releases) as (keyof typeof releases)[]).map(releaseType => releases[releaseType].map(data => ({...data, releaseType}))).flat(1).sort((b, a) => Math.min(1, Math.max(-1, a.releaseTime - b.releaseTime)));
  for (const data of releasesData) {
    if (powernukkitCache.has(data.minecraftVersion)) continue;
    const releateDate = new Date(data.releaseTime);
    const getArtefactExtension = (artefactId: string) => (artefactId.includes("REDUCED_JAR")) ? ".jar" : (artefactId.includes("REDUCED_SOURCES_JAR")) ? "-sources.jar" : (artefactId.includes("SHADED_JAR")) ? "-shaded.jar" : (artefactId.includes("SHADED_SOURCES_JAR")) ? "-shaded-sources.jar" : (artefactId.includes("JAVADOC_JAR")) ? "-javadoc.jar" : ".unknown";
    function buildArtefactUrl(data: any, artefactId?: string) {
      const buildReleaseArtefactUrl = (data: any, artefactId?: string) => !data.artefacts.includes(artefactId) ? null : util.format("https://search.maven.org/remotecontent?filepath=org/powernukkit/powernukkit/%s/powernukkit-%s%s", data.version, data.version, getArtefactExtension(artefactId));
      const buildSnapshotArtefactUrl = (data: any, artefactId?: string) => !data.artefacts.includes(artefactId) ? null : util.format("https://oss.sonatype.org/content/repositories/snapshots/org/powernukkit/powernukkit/%s-SNAPSHOT/powernukkit-%s-%s%s", data.version.substring(0, data.version.indexOf("-SNAPSHOT")), data.version.substring(0, data.version.indexOf("-SNAPSHOT")), releateDate.getUTCFullYear().toString().padStart(4, "0") + (releateDate.getUTCMonth() + 1).toString().padStart(2, "0") + releateDate.getUTCDate().toString().padStart(2, "0") + "." + releateDate.getUTCHours().toString().padStart(2, "0") + releateDate.getUTCMinutes().toString().padStart(2, "0") + releateDate.getUTCSeconds().toString().padStart(2, "0") + "-" + data.snapshotBuild, getArtefactExtension(artefactId));
      if (artefactId == "GIT_SOURCE") {
        if (data.commitId) return util.format("https://github.com/PowerNukkit/PowerNukkit/tree/%s", data.commitId);
        else if (data.snapshotBuild && data.artefacts.includes("SHADED_SOURCES_JAR")) return buildSnapshotArtefactUrl(data, "SHADED_SOURCES_JAR");
        else if (data.snapshotBuild && data.artefacts.includes("REDUCED_SOURCES_JAR")) return buildSnapshotArtefactUrl(data, "REDUCED_SOURCES_JAR");
        else if (data.artefacts.includes("SHADED_SOURCES_JAR")) return buildReleaseArtefactUrl(data, "SHADED_SOURCES_JAR");
        else if (data.artefacts.includes("REDUCED_SOURCES_JAR")) return buildReleaseArtefactUrl(data, "REDUCED_SOURCES_JAR");
      } else if (data.snapshotBuild) return buildSnapshotArtefactUrl(data, artefactId);
      return buildReleaseArtefactUrl(data, artefactId);
    }
    const artefacts = data.artefacts.reduce<{[key: string]: string}>((acc, artefactId) => {acc[artefactId] = buildArtefactUrl(data, artefactId); return acc;}, {});
    if (!(artefacts.SHADED_JAR || artefacts.REDUCED_JAR)) continue;
    powernukkitCache.set(data.minecraftVersion, {
      version: data.minecraftVersion,
      releaseDate: releateDate,
      releaseType: data.releaseType === "releases" ? "oficial" : "snapshot",
      url: artefacts.SHADED_JAR || artefacts.REDUCED_JAR,
    });
  }
}

export interface cloudburstDownload {
  releaseDate: Date;
  url: string;
}

export const nukkitCache = new versionsStorages<cloudburstDownload>();
export const cloudburstCache = new versionsStorages<cloudburstDownload>();
export async function listCloudburstProject() {
  const Projects = [ "Nukkit", "Server" ] as const;
  for (const Project of Projects) {
    const { body: { jobs } } = await http.jsonRequest<{jobs: {name: string, _class: string}[]}>(`https://ci.opencollab.dev/job/NukkitX/job/${Project}/api/json`);
    const buildFiles = await Promise.all(jobs.filter(b => b._class === "org.jenkinsci.plugins.workflow.job.WorkflowJob").map(b => b.name).map(async branch => {
      const { body: { builds } } = await http.jsonRequest<{builds: {_class: string, number: number, url: string}[]}>(`https://ci.opencollab.dev/job/NukkitX/job/${Project}/job/${branch}/api/json`);
      return Promise.all(builds.map(async build => {
        const { body: { artifacts, result, timestamp, actions } } = await http.jsonRequest<{result: "SUCCESS", actions: {_class: string, [k: string]: any}[], timestamp: number, artifacts: {displayPath: string, fileName: string, relativePath: string}[]}>(`https://ci.opencollab.dev/job/NukkitX/job/${Project}/job/${branch}/${build.number}/api/json`);
        if (result !== "SUCCESS") return [];
        const branchBuild = actions.find(r => typeof r["buildsByBranchName"] === "object");
        if (!branch) return [];
        const commitID = ((branchBuild?.buildsByBranchName[Object.keys(branchBuild.buildsByBranchName).at(0)]?.marked?.SHA1 || branchBuild.buildsByBranchName[Object.keys(branchBuild.buildsByBranchName).at(0)]?.revision?.SHA1) as string|undefined)
        let mcpeVersion: string;
        if (Project === "Server") {
          const json = xml.xml2js((await http.bufferRequestBody(`https://raw.githubusercontent.com/CloudburstMC/Server/${commitID}/pom.xml`)).toString("utf8"), {compact: true});
          const info = json["project"].dependencies.dependency.find(dep => dep.groupId._text === "com.nukkitx");
          mcpeVersion = info.version._text;
        } else {
          try {
            // https://raw.githubusercontent.com/CloudburstMC/Nukkit/master/src/main/java/cn/nukkit/network/protocol/ProtocolInfo.java
            const lines = (await http.bufferRequestBody(`https://raw.githubusercontent.com/CloudburstMC/Nukkit/${commitID}/src/main/java/cn/nukkit/network/protocol/ProtocolInfo.java`)).toString("utf8").split("\n");
            const versions = lines.filter(l => l.trim().startsWith("String") && l.toLowerCase().includes("version")).reduce<{[k: string]: string}>((acc, line) => {
              line = line.trim().slice(6).trim();
              const i = line.indexOf("=");
              const def = line.slice(0, i).trim();
              let version = line.slice(i+1).trim().slice(1, -1);
              if (version.endsWith("\"")) version = version.slice(0, -1).trim();
              if (version.startsWith("v")) version = version.slice(1);
              if (!(version.includes("+"))) acc[def] = version;
              return acc;
            }, {});
            mcpeVersion = versions.MINECRAFT_VERSION || versions.MINECRAFT_VERSION_NETWORK;
          } catch {
            return [];
          }
        }
        if (!mcpeVersion) return [];
        return artifacts.filter(f => f.relativePath.endsWith(".jar")).map(target => ({
          buildNumber: build.number,
          branch,
          mcpeVersion,
          releaseDate: new Date(timestamp),
          url: `https://ci.opencollab.dev/job/NukkitX/job/${Project}/job/${branch}/${build.number}/artifact/${target.relativePath}`,
        }));
      }));
    })).then(r => r.flat(2));
    for (const build of buildFiles.sort((b, a) => a.releaseDate.getTime() - b.releaseDate.getTime())) {
      if (Project === "Server") {
        if (cloudburstCache.has(build.mcpeVersion)) continue;
        cloudburstCache.set(build.mcpeVersion, {
          releaseDate: build.releaseDate,
          url: build.url
        });
      } else {
        if (nukkitCache.has(build.mcpeVersion)) continue;
        nukkitCache.set(build.mcpeVersion, {
          releaseDate: build.releaseDate,
          url: build.url
        });
      }
    }
  }
}

export interface pocketmineDownload {
  releateDate: Date;
  releaseType: "preview" | "oficial";
  url: string;
}

export const pocketmineCache = new versionsStorages<pocketmineDownload>();
const pocketmineGithub = await Github.repositoryManeger("pmmp", "PocketMine-MP");
export async function listPocketmineProject() {
  const pocketmineReleases = (await pocketmineGithub.release.getRelease()).filter(rel => (rel.assets.find(assert => assert.name.endsWith(".phar")) ?? {}).browser_download_url);
  for (const data of pocketmineReleases) {
    if (pocketmineCache.has(data.tag_name)) continue;
    const assest = data.assets.find(assert => assert.name.endsWith(".phar"));
    pocketmineCache.set(data.tag_name, {
      releaseType: data.prerelease ? "preview" : "oficial",
      releateDate: new Date(assest.created_at),
      url: assest.browser_download_url
    });
  };
}

export function getCacheVersions() {
  return {
    mojang: Array.from(mojangCache.keys()).reduce<{[k: string]: mojangInfo}>((acc, key) => {acc[key] = mojangCache.get(key); return acc;}, {}),
    pocketmine: Array.from(pocketmineCache.keys()).reduce<{[k: string]: pocketmineDownload}>((acc, key) => {acc[key] = pocketmineCache.get(key); return acc;}, {}),
    powernukkit: Array.from(powernukkitCache.keys()).reduce<{[k: string]: powernukkitDownload}>((acc, key) => {acc[key] = powernukkitCache.get(key); return acc;}, {}),
    nukkit: Array.from(nukkitCache.keys()).reduce<{[k: string]: cloudburstDownload}>((acc, key) => {acc[key] = nukkitCache.get(key); return acc;}, {}),
    cloudburst: Array.from(cloudburstCache.keys()).reduce<{[k: string]: cloudburstDownload}>((acc, key) => {acc[key] = cloudburstCache.get(key); return acc;}, {}),
  };
}