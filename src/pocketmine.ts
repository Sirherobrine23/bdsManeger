import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as tar from "tar";
import { existsSync as  fsExistsSync } from "node:fs";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { execFileAsync, execAsync } from './childPromisses';
import { logRoot, serverRoot } from "./pathControl";
import { getBuffer, githubRelease, GithubRelease, saveFile } from "./httpRequest";
import { actionConfig, actions } from './globalPlatfroms';
import AdmZip from "adm-zip";
import { promisify } from 'node:util';
export const serverPath = path.join(serverRoot, "pocketmine");
export const serverPhar = path.join(serverPath, "pocketmine.phar");
export const phpBinPath = path.join(serverPath, "bin", (process.platform === "win32"?"php":"bin"), "php");

async function Readdir(pathRead: string, filter?: RegExp[]) {
if (!filter) filter = [/.*/];
  const fixedPath = path.resolve(pathRead);
  const files: {path: string, name: string}[] = [];
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
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  const tempFolder = path.join(os.tmpdir(), "bdsPhp_"+(Math.random()*19999901).toString(16).replace(".", "").replace(/[0-9]/g, (_, a) =>a=="1"?"a":a=="2"?"b":a=="3"?"S":"k"));
  if (!fsExistsSync(tempFolder)) fs.mkdir(tempFolder, {recursive: true});
  if (process.platform === "win32") {
    const env = {VS_EDITION: process.env.VS_EDITION||"Enterprise", SOURCES_PATH: process.env.SOURCES_PATH||`${tempFolder}\\pocketmine-php-sdk`};
    await execFileAsync("git", ["clone", "--depth=1", "https://github.com/pmmp/php-build-scripts.git", tempFolder], {cwd: tempFolder, stdio: "inherit"});
    await execAsync(".\\windows-compile-vs.bat", {cwd: tempFolder, stdio: "inherit", env});
    await promisify((new AdmZip(path.join(tempFolder, (await fs.readdir(tempFolder)).find(file => file.endsWith(".zip"))))).extractAllToAsync)(serverPath, false, true);
  } else {
    const buildFile = path.join(tempFolder, "build.sh");
    await fs.writeFile(buildFile, await getBuffer("https://raw.githubusercontent.com/pmmp/php-build-scripts/stable/compile.sh"));
    await fs.chmod(buildFile, "777");
    await execFileAsync(buildFile, ["-j"+os.cpus().length], {cwd: tempFolder, stdio: "inherit"});
    await fs.cp(path.join(tempFolder, "bin", (await fs.readdir(path.join(tempFolder, "bin")))[0]), path.join(serverPath, "bin"), {force: true, recursive: true, preserveTimestamps: true, verbatimSymlinks: true});
  }
  await fs.rm(tempFolder, {recursive: true, force: true});
  console.log("PHP Build success!");
}

async function installPhp(): Promise<void> {
  const releases: (githubRelease["assets"][0])[] = [];
  (await GithubRelease("The-Bds-Maneger", "Build-PHP-Bins")).map(re => re.assets).forEach(res => releases.push(...res));
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  if (process.platform === "win32") {
    let url: string = releases.filter(assert => assert.name.endsWith(".zip")).find(assert => /win32|windows/.test(assert.name))?.browser_download_url;
    if (!url) throw new Error("Cannnot get php url");
    return promisify((new AdmZip(await saveFile(url))).extractAllToAsync)(serverPath, false, true);
  } else {
    await fs.mkdir(path.resolve(serverPath, "bin"), {recursive: true});
    const file = releases.find(re => re.name.includes(process.platform) && re.name.includes(process.arch));
    if (file) {
      const downloadFile = await saveFile(file.browser_download_url);
      // Tar.gz
      if (/tar\.gz/.test(file.name)) await tar.extract({file: downloadFile, C: path.join(serverPath, "bin"), keep: true, p: true, noChmod: false});
      else await promisify((new AdmZip(downloadFile)).extractAllToAsync)(serverPath, false, true);
      if (process.platform === "linux"||process.platform === "android"||process.platform === "darwin") {
        const ztsFind = await Readdir(path.resolve(serverPath, "bin"), [/.*debug-zts.*/]);
        if (ztsFind.length > 0) {
          const phpIniPath = (await Readdir(path.resolve(serverPath, "bin"), [/php\.ini$/]))[0].path;
          let phpIni = await fs.readFile(phpIniPath, "utf8");
          if (phpIni.includes("extension_dir")) await fs.writeFile(phpIniPath, phpIni.replace(/extension_dir=.*/g, ""));
          phpIni = phpIni+`\nextension_dir=${path.resolve(ztsFind[0].path, "..")}`
          await fs.writeFile(phpIniPath, phpIni);
        }
      }
    }
  }
  // test it's works php
  await fs.writeFile(path.join(os.tmpdir(), "bds_test.php"), `<?php echo "Hello World";`);
  await execFileAsync(phpBinPath, ["-f", path.join(os.tmpdir(), "test.php")]).catch(buildPhp);
}

export async function installServer(version: string|boolean) {
  if (!fsExistsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await installPhp();
  await fs.writeFile(serverPhar, (await platformManeger.pocketmine.find(version))?.url);
}

// [16:47:35.405] [Server thread/INFO]: Minecraft network interface running on 0.0.0.0:19132
export const portListen = /\[.*\]:\s+Minecraft\s+network\s+interface\s+running\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|\[[A-Za-z0-9:]+\]|):([0-9]+))/;
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const player = /[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi;

const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run: (child) => child.runCommand("stop")
  },
  {
    name: "serverStarted",
    callback(data, done) {
      // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
      if (started.test(data)) done(new Date());
    }
  },
  {
    name: "portListening",
    callback(data, done) {
      const portParse = data.match(portListen);
      if (!portParse) return;
      const [,, host, port] = portParse;
      done({
        protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
        type: "UDP",
        port: parseInt(port),
        host: host?.trim()
      });
    }
  },
  {
    name: "playerAction",
    callback(data, done) {
      data;
    },
  },
];

export async function startServer() {
  if (!fsExistsSync(serverPath)) throw new Error("Install server fist!");
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_pocketmine_${process.platform}_${process.arch}.stdout.log`);
  return new actions({command: phpBinPath, args: [serverPhar, "--no-wizard", "--enable-ansi"], options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}}, serverConfig);
}