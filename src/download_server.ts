import path from "path";
import fs from "fs";
import os from "os";
import adm_zip from "adm-zip";
import tar from "tar";
import * as httpRequests from "./HttpRequests";
import * as bdsTypes from "./globalType";
import * as bdschildProcess from "./childProcess";

type getVersionsType = {
  latest: {
    [d: string]: string|undefined
  };
  platform: Array<{
    name: bdsTypes.Platform;
    version: string;
    Date: string;
    data: string | {[platform: string]: {[arch: string]: string;};};
  }>;
};

export async function getVersions(): Promise<getVersionsType> {
  return JSON.parse((await httpRequests.getBuffer("https://raw.githubusercontent.com/The-Bds-Maneger/ServerVersions/main/src/Versions.json")).toString("utf8"));
}

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

export async function DownloadServer(Platform: bdsTypes.Platform, Version: string|boolean) {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), Platform);
  const versions = await getVersions();
  const info = versions.platform.filter(v => v.name === Platform).find(v => v.version === (typeof Version === "boolean"?versions.latest[Platform]:Version));
  if (Platform === "bedrock") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    let arch = process.arch;
    if (process.platform === "linux" && process.arch !== "x64") {
      const existQemu = await bdschildProcess.runCommandAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false);
      if (existQemu) arch = "x64";
    }
    console.log(info.data[process.platform], arch, info.data[process.platform][arch]);
    const BedrockZip = new adm_zip(await httpRequests.getBuffer(info.data[process.platform][arch]));
    let realPathWorldBedrock = "";
    if (fs.existsSync(path.resolve(ServerPath, "worlds"))) {
      if (fs.lstatSync(path.resolve(ServerPath, "worlds")).isSymbolicLink()) {
        realPathWorldBedrock = await fs.promises.realpath(path.resolve(ServerPath, "worlds"));
        await fs.promises.unlink(path.resolve(ServerPath, "worlds"));
      }
    }
    BedrockZip.extractAllTo(ServerPath, true);
    if (!!realPathWorldBedrock) await fs.promises.symlink(realPathWorldBedrock, path.resolve(ServerPath, "worlds"), "dir");
  } else if (Platform === "java") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    await fs.promises.writeFile(path.resolve(ServerPath, "Server.jar"), await httpRequests.getBuffer(String(info.data)));
    await fs.promises.writeFile(path.resolve(ServerPath, "eula.txt"), "eula=true");
  } else if (Platform === "spigot") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    await fs.promises.writeFile(path.resolve(ServerPath, "Spigot.jar"), await httpRequests.getBuffer(String(info.data)));
  } else if (Platform === "pocketmine") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    await InstallPHP(ServerPath);
    await fs.promises.writeFile(path.resolve(ServerPath, "PocketMine.phar"), await httpRequests.getBuffer(String(info.data)));
  } else if (Platform === "dragonfly") {
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    await fs.promises.writeFile(path.resolve(ServerPath, "Dragonfly"+(process.platform === "win32"?".exe":"")), await httpRequests.getBuffer(String(info.data)));
  }
  return {
    Version: info.version,
    Date: new Date(info.Date),
    url: (typeof info.data === "string"? info.data : info.data[process.platform][process.arch])
  };
}