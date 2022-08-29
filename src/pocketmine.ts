import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as tar from "tar";
import { existsSync as  fsExistsSync } from "node:fs";
import { getPocketminePhar, versionUrl } from "@the-bds-maneger/server_versions";
import { execFileAsync } from "./childPromisses";
import { serverRoot } from "./pathControl";
import { getBuffer } from "./httpRequest";
import {} from "./globalPlatfroms";
import AdmZip from "adm-zip";
import { promisify } from 'node:util';
export const serverPath = path.join(serverRoot, "pocketmine");
export const serverPhar = path.join(serverPath, "pocketmine.phar");

async function Readdir(pathRead: string, filter?: Array<RegExp>) {
if (!filter) filter = [/.*/];
  const fixedPath = path.resolve(pathRead);
  const files: Array<{
    path: string,
    name: string
  }> = [];
  for (const file of await fs.readdir(fixedPath)) {
    const FullFilePath = path.join(fixedPath, file);
    const stats = await fs.stat(FullFilePath);
    if (stats.isDirectory()) files.push(...(await Readdir(FullFilePath, filter)));
    else if (stats.isSymbolicLink()) {
      const realPath = await fs.realpath(FullFilePath);
      const statsSys = await fs.stat(realPath);
      if (statsSys.isDirectory()) files.push(...(await Readdir(realPath, filter)));
      else if (filter.length === 0||filter.some(x => x.test(realPath))) files.push({
        path: FullFilePath,
        name: path.basename(FullFilePath)
      });
    } else if (filter.length === 0||filter.some(x => x.test(FullFilePath))) files.push({
      path: FullFilePath,
      name: path.basename(FullFilePath)
    });
  }
  return files;
}

async function buildPhp() {
  if (process.platform === "win32") throw new Error("Script is to Linux and MacOS");
  const tempFolder = path.join(os.tmpdir(), "bdsPhp_"+(Math.random()*19999901).toString(16).replace(".", "").replace(/[0-9]/g, (_, a) =>a=="1"?"a":a=="2"?"b":a=="3"?"S":"k"));
  if (!fsExistsSync(tempFolder)) fs.mkdir(tempFolder, {recursive: true});
  await fs.writeFile(path.join(tempFolder, "build.sh"), await getBuffer("https://raw.githubusercontent.com/pmmp/php-build-scripts/stable/compile.sh"));
  await fs.chmod(path.join(tempFolder, "build.sh"), "777");
  console.info("Building PHP!");
  await execFileAsync(path.join(tempFolder, "build.sh"), ["-j"+os.cpus().length], {cwd: tempFolder, stdio: "inherit"});
  await fs.cp(path.join(tempFolder, "bin", (await fs.readdir(path.join(tempFolder, "bin")))[0]), path.join(serverPath, "bin"), {force: true, recursive: true, preserveTimestamps: true, verbatimSymlinks: true});
  console.log("PHP Build success!");
}
buildPhp();

async function installPhp(): Promise<void> {
  const file = (await getBuffer(`${versionUrl}/pocketmine/bin?os=${process.platform}&arch=${process.arch}`).then(res => JSON.parse(res.toString("utf8")) as {url: string, name: string}[]))[0];
  if (!file) return buildPhp();
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  // Tar.gz
  if (/tar\.gz/.test(file.name)) {
    await fs.writeFile(path.join(os.tmpdir(), file.name), await getBuffer(file.url));
    await tar.extract({
      file: path.join(os.tmpdir(), file.name),
      C: path.join(serverPath, "bin"),
      keep: true,
      p: true,
      noChmod: false
    });
  } else {
    const zip = new AdmZip(await getBuffer(file.url));
    await promisify(zip.extractAllToAsync)(serverPath, false, true);
  }
  if (process.platform === "linux"||process.platform === "android"||process.platform === "darwin") {
    const ztsFind = await Readdir(path.resolve(serverPath, "bin"), [/.*debug-zts.*/]);
    if (ztsFind.length === 0) return;
    const phpIniPath = (await Readdir(path.resolve(serverPath, "bin"), [/php\.ini$/]))[0].path;
    let phpIni = await fs.readFile(phpIniPath, "utf8");
    if (phpIni.includes("extension_dir")) await fs.writeFile(phpIniPath, phpIni.replace(/extension_dir=.*/g, ""));
    phpIni = phpIni+`\nextension_dir=${ztsFind[0].path}`
    await fs.writeFile(phpIniPath, phpIni);
  }
  // test it's works php
  await fs.writeFile(path.join(os.tmpdir(), "test.php"), `<?php echo "Hello World";`);
  await execFileAsync(path.join(serverPath, "bin", process.platform === "win32" ? "php/php.exe" : "php"), ["-f", path.join(os.tmpdir(), "test.php")]).catch(buildPhp);
}

export async function installServer(version: string|boolean) {
  if (!fsExistsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await installPhp();
  await fs.writeFile(serverPhar, await getPocketminePhar(version));
}