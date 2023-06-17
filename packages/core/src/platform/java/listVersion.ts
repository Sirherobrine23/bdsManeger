import { Github, http } from "@sirherobrine23/http";
import stream from "node:stream";
import path from "path";
import semver from "semver";
import { bdsFilesBucket } from "../../internalClouds.js";
import { versionsStorages } from "../../serverRun.js";

interface baseDownload {
  URL: string;
  releaseDate: Date;
}

interface mojangInfo extends baseDownload {
  release: "oficial" | "snapshot" | "beta" | "alpha";
}

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

export const mojangCache = new versionsStorages<mojangInfo>();
export async function listMojang() {
  const versions = (await http.jsonRequestBody<{ versions: { id: string, releaseTime: string, url: string, type: "snapshot" | "release" | "old_beta" | "old_alpha" }[] }>("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json")).versions;
  await PromiseSplit(versions, async version => {
    if (mojangCache.has(version.id)) return;
    const { downloads: { server } } = await http.jsonRequestBody<{ downloads: { server?: { url: string } } }>(version.url);
    if (!server) return;
    mojangCache.set(version.id, {
      release: version.type === "release" ? "oficial" : version.type === "snapshot" ? "snapshot" : version.type === "old_beta" ? "beta" : "alpha",
      releaseDate: new Date(version.releaseTime),
      URL: server.url,
    });
  });
}

export interface spigotDownload {
  getServer(): Promise<stream.Readable>;
  craftbukkit?(): Promise<stream.Readable>;
}

export const spigotCache = new versionsStorages<spigotDownload>();
export async function listSpigot() {
  const spigotFiles = await bdsFilesBucket.listFiles("SpigotBuild/");
  for (const file of spigotFiles.filter(file => file.name.slice(12).startsWith("1.")).sort((b, a) => {
    const valid = (c: typeof a) => semver.valid(semver.coerce(c.name.slice(12, -4), { loose: true }), { loose: true });
    return semver.compare(valid(a), valid(b));
  })) {
    const version = file.name.slice(12, -4), fixVersion = semver.valid(semver.coerce(version, { loose: true }), { loose: true });
    if (spigotCache.has(fixVersion)) continue;
    const craftbukkit = spigotFiles.find(file => file.name.slice(12).startsWith(`craftbukkit-${version}.jar`));
    spigotCache.set(fixVersion, {
      getServer: file.getFile,
      craftbukkit: craftbukkit ? craftbukkit.getFile : undefined,
    });
  }
}

export const paperCache = new versionsStorages<baseDownload>();
export const velocityCache = new versionsStorages<baseDownload>();
export const foliaCache = new versionsStorages<baseDownload>();
export async function listPaperProject() {
  const paperProjects = ["paper", "velocity", "folia"] as const;
  await Promise.all(paperProjects.map(async projectName => {
    const baseURL = new URL(path.posix.join("/v2/projects", projectName), "https://api.papermc.io");
    const projectInfo = await http.jsonRequestBody<{ versions: string[] }>(baseURL);
    for (const projectVersion of projectInfo.versions) {
      if (projectName === "paper" && paperCache.has(projectVersion)) continue;
      else if (projectName === "velocity" && velocityCache.has(projectVersion)) continue;
      else if (projectName === "folia" && foliaCache.has(projectVersion)) continue;
      else {
        const versionBase = new URL(path.posix.join(baseURL.pathname, "versions", projectVersion), baseURL);
        const builds = await http.jsonRequestBody<{ builds: number[] }>(versionBase);
        for (const build of builds.builds) {
          const buildURL = new URL(path.posix.join(versionBase.pathname, "builds", String(build)), versionBase);
          const downloadInfo = await http.jsonRequestBody<{ time: string; downloads: { application?: { name: string } } }>(buildURL);
          if (downloadInfo.downloads.application) {
            const downloadURL = new URL(path.posix.join(buildURL.pathname, "downloads", downloadInfo.downloads.application.name), buildURL);
            if (projectName === "paper") paperCache.set(projectVersion, { URL: downloadURL.toString(), releaseDate: new Date(downloadInfo.time) });
            else if (projectName === "velocity") velocityCache.set(projectVersion, { URL: downloadURL.toString(), releaseDate: new Date(downloadInfo.time) });
            else if (projectName === "folia") foliaCache.set(projectVersion, { URL: downloadURL.toString(), releaseDate: new Date(downloadInfo.time) });
            break;
          }
        }
      }
    }
  }));
}

export const purpurCache = new versionsStorages<baseDownload>();
export async function listPurpurProject() {
  const baseURL = new URL("https://api.purpurmc.org/v2/purpur");
  const { versions } = await http.jsonRequestBody<{ versions: string[] }>(baseURL);
  for (const version of versions) {
    if (purpurCache.has(version)) continue;
    const infoBase = new URL(path.posix.join(baseURL.pathname, version, "latest"), baseURL);
    const relInfo = await http.jsonRequestBody<{ timestamp: number }>(infoBase);
    purpurCache.set(version, {
      URL: (new URL(path.posix.join(infoBase.pathname, "download"), infoBase)).toString(),
      releaseDate: new Date(relInfo.timestamp)
    });
  }
}

export const glowstoneCache = new versionsStorages<baseDownload>();
export async function listGlowstoneProject() {
  const repo = await Github.repositoryManeger("GlowstoneMC", "Glowstone");
  const rels = (await repo.release.getRelease()).filter(rel => rel.assets.some(asset => asset.name.endsWith(".jar")));
  rels.forEach(rel => rel.assets.forEach(asset => glowstoneCache.has(rel.tag_name) ? null : glowstoneCache.set(rel.tag_name, {
    URL: asset.browser_download_url,
    releaseDate: new Date(asset.created_at)
  })));
}

export const cuberiteCache = new versionsStorages<{ URL: string[] }>({
  "win32-x64": {
    URL: ["https://download.cuberite.org/windows-x86_64/Cuberite.zip"]
  },
  "win32-ia32": {
    URL: ["https://download.cuberite.org/windows-i386/Cuberite.zip"]
  }
});
export async function listCuberite() {
  const projects = ["android", "linux-aarch64", "linux-armhf", "linux-i386", "linux-x86_64", "darwin-x86_64"] as const;
  await Promise.all(projects.map(async project => {
    const { builds = [] } = await http.jsonRequestBody<{ builds: { number: number, _class: string }[] }>(`https://builds.cuberite.org/job/${project}/api/json`);
    for (const job of builds) {
      const { artifacts = [], result } = await http.jsonRequestBody<{ result: string, artifacts: { relativePath: string, fileName: string }[] }>(`https://builds.cuberite.org/job/${project}/${job.number}/api/json`);
      if (result !== "SUCCESS") continue;
      let map = artifacts.filter(file => !file.fileName.endsWith(".sha1")).map(file => `https://builds.cuberite.org/job/${project}/${job.number}/artifact/${file.relativePath}`);
      if (!map.length) continue;
      else if (project === "darwin-x86_64") cuberiteCache.set("darwin-x64", { URL: map });
      else if (project === "linux-x86_64") cuberiteCache.set("linux-x64", { URL: map });
      else if (project === "linux-aarch64") cuberiteCache.set("linux-arm64", { URL: map });
      else if (project === "linux-armhf") cuberiteCache.set("linux-arm", { URL: map });
      else if (project === "linux-i386") cuberiteCache.set("linux-ia32", { URL: map });
      else if (project === "android") {
        const serverIndex = map.findIndex(file => file.toLowerCase().endsWith("server.zip"));
        const server = map[serverIndex];
        delete map[serverIndex];
        map = map.filter(Boolean);
        for (const file of map) {
          const fileURL = new URL(file);
          const plat = path.basename(fileURL.pathname).replace(path.extname(fileURL.pathname), "");
          if (plat.startsWith("x86_64")) cuberiteCache.set("android-x64", { URL: [server, file] });
          else if (plat.startsWith("x86")) cuberiteCache.set("android-ia32", { URL: [server, file] });
          else if (plat.startsWith("arm64")) cuberiteCache.set("android-arm64", { URL: [server, file] });
          else if (plat.startsWith("arm")) cuberiteCache.set("android-arm", { URL: [server, file] });
        }
      }
      break;
    }
  }));
}

export async function syncCaches() {
  await Promise.all([
    listMojang(),
    listSpigot(),
    listPaperProject(),
    listPurpurProject(),
    listGlowstoneProject(),
    listCuberite(),
  ]);
}