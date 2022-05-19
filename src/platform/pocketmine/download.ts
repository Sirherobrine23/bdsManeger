import path from "path";
import fs from "fs";
import os from "os";
import adm_zip from "adm-zip";
import tar from "tar";
import * as versionManeger from "@the-bds-maneger/server_versions";
import * as httpRequests from "../../HttpRequests";
import * as childProcess from "../../childProcess";

export async function buildPHPBinWithDocker() {
  const dockerFileUrl = "https://raw.githubusercontent.com/The-Bds-Maneger/Build-PHP-Bins/main/Dockerfile";
  const tempFolder = path.join(os.tmpdir(), Buffer.from(Math.random().toString()).toString("hex"));
  await fs.promises.mkdir(tempFolder, {recursive: true});
  await childProcess.runCommandAsync(`docker buildx build "${dockerFileUrl}" -t phplocalbuild --output=./phplocalbuild`, {
    cwd: tempFolder
  });
  throw new Error("Not implemented yet");
}

async function InstallPrebuildPHP(serverPath: string) {
  const nameTest = (name: string) => (process.platform === "win32" ? /\.zip/:/\.tar\.gz/).test(name) && RegExp(process.platform).test(name) && RegExp(process.arch).test(name);
  const Release = (await httpRequests.getGithubRelease("The-Bds-Maneger", "PocketMinePHPAutoBinBuilds")).map(release => {
    release.assets = release.assets.filter(asset => nameTest(asset.name));
    return release;
  }).filter(res => res.assets.length > -1);
  if (Release.length === 0) throw new Error("No file found for this Platform and Arch");
  const urlBin = Release[0].assets[0].browser_download_url;
  if (!urlBin) throw new Error("No file found for this Platform and Arch");
  console.log("PHP File download url: %s", urlBin);
  if (/\.tar\.gz/.test(urlBin)) {
    const tmpFileTar = path.join(os.tmpdir(), Buffer.from(Math.random().toString()).toString("hex")+"bdscore.tar.gz");
    await fs.promises.writeFile(tmpFileTar, await httpRequests.getBuffer(urlBin));
    if (fs.existsSync(path.join(serverPath, "bin"))) {
      await fs.promises.rm(path.join(serverPath, "bin"), {recursive: true});
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

export default async function download(version: string|boolean) {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), "pocketmine");
  if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
  const pocketmineInfo = await versionManeger.findUrlVersion("pocketmine", version);
  await fs.promises.writeFile(path.resolve(ServerPath, "PocketMine.phar"), await httpRequests.getBuffer(String(pocketmineInfo.url)));
  await InstallPrebuildPHP(ServerPath);

  // Return info
  return {
    version: pocketmineInfo.version,
    publishDate: pocketmineInfo.datePublish,
    url: pocketmineInfo.url,
  };
}