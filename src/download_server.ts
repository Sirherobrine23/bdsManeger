import path from "path";
import fs from "fs";
import os from "os";
import adm_zip from "adm-zip";
import tar from "tar";
import * as httpRequests from "./HttpRequests";
import * as bdsTypes from "./globalType";
import * as bdschildProcess from "./childProcess";
import * as the_bds_maneger_server_versions from "@the-bds-maneger/server_versions";

async function InstallPHP(serverPath: string) {
  const nameTest = (name: string) => (process.platform === "win32" ? /\.zip/:/\.tar\.gz/).test(name) && RegExp(process.platform).test(name) && RegExp(process.arch).test(name);
  const Release = (await httpRequests.getGithubRelease("The-Bds-Maneger", "PocketMinePHPAutoBinBuilds")).map(release => {
    release.assets = release.assets.filter(asset => nameTest(asset.name));
    return release;
  }).filter(res => res.assets.length > 0);
  if (Release.length === 0) throw new Error("No file found for this Platform and Arch");
  const urlBin = Release[0].assets[0].browser_download_url;
  if (!urlBin) throw new Error("No file found for this Platform and Arch");
  if (/\.tar\.gz/.test(urlBin)) {
    const tmpFileTar = path.join(os.tmpdir(), Buffer.from(Math.random().toString()).toString("hex")+"bdscore.tar.gz");
    await fs.promises.writeFile(tmpFileTar, await httpRequests.getBuffer(urlBin));
    if (fs.existsSync(path.join(serverPath, "bin"))) {
      await fs.promises.rmdir(path.join(serverPath, "bin"), {recursive: true});
      await fs.promises.mkdir(path.join(serverPath, "bin"));
    } else await fs.promises.mkdir(path.join(serverPath, "bin"));
    await tar.x({
      file: tmpFileTar,
      C: path.join(serverPath, "bin"),
      keep: true,
      p: true,
      noChmod: false
    });
    await fs.promises.rm(tmpFileTar, {force: true});
  } else {
    const PHPZip = new adm_zip(await httpRequests.getBuffer(urlBin));
    if (fs.existsSync(path.resolve(serverPath, "bin"))) await fs.promises.rm(path.resolve(serverPath, "bin"), {recursive: true});
    await new Promise((res,rej) => PHPZip.extractAllToAsync(serverPath, false, true, err => err?rej(err):res("")));
  }
  return urlBin;
}

export async function DownloadServer(Platform: bdsTypes.Platform, Version: string|boolean): Promise<{Version: string, Date: Date; url: string;}> {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), Platform);
  if (Platform === "bedrock") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    let arch = process.arch;
    if (process.platform === "linux" && process.arch !== "x64") {
      const existQemu = await bdschildProcess.runCommandAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false);
      if (existQemu) arch = "x64";
    }
    const bedrockInfo = await the_bds_maneger_server_versions.findUrlVersion(Platform as the_bds_maneger_server_versions.BdsCorePlatforms, Version, arch as the_bds_maneger_server_versions.arch);
    const BedrockZip = new adm_zip(await httpRequests.getBuffer(bedrockInfo.url));
    let realPathWorldBedrock = "";
    if (fs.existsSync(path.resolve(ServerPath, "worlds"))) {
      if (fs.lstatSync(path.resolve(ServerPath, "worlds")).isSymbolicLink()) {
        realPathWorldBedrock = await fs.promises.realpath(path.resolve(ServerPath, "worlds"));
        await fs.promises.unlink(path.resolve(ServerPath, "worlds"));
      }
    }
    BedrockZip.extractAllTo(ServerPath, true);
    if (!!realPathWorldBedrock) await fs.promises.symlink(realPathWorldBedrock, path.resolve(ServerPath, "worlds"), "dir");
    return {
      Version: bedrockInfo["version"],
      Date: bedrockInfo.datePublish,
      url: bedrockInfo.url
    };
  } else if (Platform === "java") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    const javaInfo = await the_bds_maneger_server_versions.findUrlVersion(Platform as the_bds_maneger_server_versions.BdsCorePlatforms, Version);
    await fs.promises.writeFile(path.resolve(ServerPath, "Server.jar"), await httpRequests.getBuffer(String(javaInfo.url)));
    await fs.promises.writeFile(path.resolve(ServerPath, "eula.txt"), "eula=true");
    return {
      Version: javaInfo["version"],
      Date: javaInfo.datePublish,
      url: javaInfo.url
    };
  } else if (Platform === "spigot") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    const spigotInfo = await the_bds_maneger_server_versions.findUrlVersion(Platform as the_bds_maneger_server_versions.BdsCorePlatforms, Version);
    await fs.promises.writeFile(path.resolve(ServerPath, "Spigot.jar"), await httpRequests.getBuffer(String(spigotInfo.url)));
    await fs.promises.writeFile(path.resolve(ServerPath, "eula.txt"), "eula=true");
    return {
      Version: spigotInfo["version"],
      Date: spigotInfo.datePublish,
      url: spigotInfo.url
    };
  } else if (Platform === "pocketmine") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    await InstallPHP(ServerPath);
    const pocketmineInfo = await the_bds_maneger_server_versions.findUrlVersion(Platform as the_bds_maneger_server_versions.BdsCorePlatforms, Version);
    await fs.promises.writeFile(path.resolve(ServerPath, "PocketMine.phar"), await httpRequests.getBuffer(String(pocketmineInfo.url)));
    return {
      Version: pocketmineInfo["version"],
      Date: pocketmineInfo.datePublish,
      url: pocketmineInfo.url
    };
  }
  throw new Error("No file found for this Platform and Arch");
}
