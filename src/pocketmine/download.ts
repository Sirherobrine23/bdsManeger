import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import * as child_process from "node:child_process";
import { randomBytes } from "node:crypto";
import adm_zip from "adm-zip";
import tar from "tar";
import Readdirrec from "../lib/listRecursive";
import * as versionManeger from "@the-bds-maneger/server_versions";
import * as httpRequests from "../lib/HttpRequests";
import { serverRoot } from "../pathControl";

export async function buildLocal(serverPath: string) {
  if (process.platform === "win32") throw new Error("Current only to unix support");
  const randomFolder = path.join(os.tmpdir(), "bdscore_php_"+randomBytes(8).toString("hex"));
  await new Promise<void>((resolve, reject) => {
    child_process.execFile("git", ["clone", "--depth", "1", "https://github.com/pmmp/php-build-scripts.git", randomFolder], (err) => {
      if (!!err) return reject(err);
      const cpuCores = os.cpus().length * 4||2;
      const compiler = child_process.execFile("./compile.sh", ["-j"+cpuCores], {cwd: randomFolder}, err2 => {
        if (!!err2) return reject(err2);
        resolve();
      });
      compiler.stdout.on("data", data => process.stdout.write(data));
      compiler.stderr.on("data", data => process.stdout.write(data));
    });
  });
  await Readdirrec(path.join(randomFolder, "bin/php7")).then(files => files.map(file => {
    console.log("Move '%s' to PHP Folder", file.path);
    return fs.promises.cp(file.path, path.join(file.path.replace(path.join(randomFolder, "bin/php7"), serverPath)));
  })).then(res => Promise.all(res));
}

async function InstallPrebuildPHP(serverPath: string) {
  const nameTest = (name: string) => (process.platform === "win32" ? /\.zip/:/\.tar\.gz/).test(name) && RegExp(process.platform).test(name) && RegExp(process.arch).test(name);
  const Release = (await httpRequests.getGithubRelease("The-Bds-Maneger", "PocketMinePHPAutoBinBuilds")).map(release => {
    release.assets = release.assets.filter(asset => nameTest(asset.name));
    return release;
  }).filter(res => res.assets.length >= 1);
  if (Release.length === 0) throw new Error("No file found for this Platform and Arch");
  const urlBin = Release[0].assets[0].browser_download_url;
  if (!urlBin) throw new Error("No file found for this Platform and Arch");
  if (/\.tar\.gz/.test(urlBin)) {
    const tmpFileTar = path.join(os.tmpdir(), Buffer.from(Math.random().toString()).toString("hex")+"bdscore_php.tar.gz");
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
  if (process.platform === "linux"||process.platform === "android"||process.platform === "darwin") {
    const ztsFind = await Readdirrec(path.resolve(serverPath, "bin"), [/.*debug-zts.*/]);
    if (ztsFind.length === 0) return urlBin;
    const phpIniPath = (await Readdirrec(path.resolve(serverPath, "bin"), [/php\.ini$/]))[0].path;
    let phpIni = await fs.promises.readFile(phpIniPath, "utf8");
    if (phpIni.includes("extension_dir")) {
      await fs.promises.writeFile(phpIniPath, phpIni.replace(/extension_dir=.*/g, ""));
    }
    phpIni = phpIni+`\nextension_dir=${ztsFind[0].path}`
    await fs.promises.writeFile(phpIniPath, phpIni);
  }
  return urlBin;
}

export async function download(version: string|boolean) {
  const ServerPath = path.join(serverRoot, "pocketmine");
  if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
  const pocketmineInfo = await versionManeger.findUrlVersion("pocketmine", version);
  await fs.promises.writeFile(path.resolve(ServerPath, "PocketMine.phar"), await httpRequests.getBuffer(String(pocketmineInfo.url)));
  await buildLocal(ServerPath).catch(err => {console.log("Error on build in system, error:\n%o\nDownloading pre build files", err); return InstallPrebuildPHP(ServerPath);});

  // Return info
  return {
    version: pocketmineInfo.version,
    publishDate: pocketmineInfo.datePublish,
    url: pocketmineInfo.url,
  };
}