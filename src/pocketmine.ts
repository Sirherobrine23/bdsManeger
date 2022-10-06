import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import AdmZip from "adm-zip";
import * as globalPlatfroms from "./globalPlatfroms";
import { existsSync as fsExistsSync, Stats } from "node:fs";
import { promisify } from "node:util";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { execFileAsync, execAsync } from "./lib/childPromisses";
import { getBuffer, githubRelease, GithubRelease, saveFile, tarExtract } from "./lib/httpRequest";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";

async function findPhp(serverPath: string, extraPath?: string): Promise<string> {
  if (!extraPath) extraPath = path.join(serverPath, "bin");
  const files = await Promise.all((await fs.readdir(extraPath)).map(file => fs.lstat(path.join(extraPath, file)).then(stat => ({stat, file, fullPath: path.join(extraPath, file)})).catch(() => {})));
  let folderFF = "";
  for (const file of (files.filter(a=>!!a) as {file: string, fullPath: string, stat: Stats}[]).sort(a => a.stat.isDirectory() ? 1:-1)) {
    if (file.stat.isDirectory()) {
      folderFF = await findPhp(serverPath, file.fullPath).catch(() => "");
      if (folderFF) return folderFF;
    } else if (file.file === "php"||file.file === "php.exe") return file.fullPath;
  }
  if (folderFF) return folderFF;
  throw new Error("Cannot find php");
}

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

async function buildPhp(serverPath: string, buildFolder: string) {
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  if (process.platform === "win32") {
    const env = {VS_EDITION: process.env.VS_EDITION||"Enterprise", SOURCES_PATH: process.env.SOURCES_PATH||`${buildFolder}\\pocketmine-php-sdk`};
    await execFileAsync("git", ["clone", "--depth=1", "https://github.com/pmmp/php-build-scripts.git", buildFolder], {cwd: buildFolder, stdio: "inherit"});
    await execAsync(".\\windows-compile-vs.bat", {cwd: buildFolder, stdio: "inherit", env});
    await promisify((new AdmZip(path.join(buildFolder, (await fs.readdir(buildFolder)).find(file => file.endsWith(".zip"))))).extractAllToAsync)(serverPath, false, true);
  } else {
    const buildFile = path.join(buildFolder, "build.sh");
    await fs.writeFile(buildFile, await getBuffer("https://raw.githubusercontent.com/pmmp/php-build-scripts/stable/compile.sh"));
    await fs.chmod(buildFile, "777");
    await execFileAsync(buildFile, ["-j"+os.cpus().length], {cwd: buildFolder, stdio: "inherit"});
    await fs.cp(path.join(buildFolder, "bin", (await fs.readdir(path.join(buildFolder, "bin")))[0]), path.join(serverPath, "bin"), {force: true, recursive: true, preserveTimestamps: true, verbatimSymlinks: true});
  }
  await fs.rm(buildFolder, {recursive: true, force: true});
  console.log("PHP Build success!");
}

async function installPhp(serverPath: string, buildFolder: string): Promise<void> {
  const releases: (githubRelease["assets"][0])[] = [];
  (await GithubRelease("The-Bds-Maneger", "Build-PHP-Bins")).map(re => re.assets).forEach(res => releases.push(...res));
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  await fs.writeFile(path.join(os.tmpdir(), "bds_test.php"), `<?php echo "Hello World";`);
  if (process.platform === "win32") {
    let url: string = releases.filter(assert => assert.name.endsWith(".zip")).find(assert => /win32|windows/.test(assert.name))?.browser_download_url;
    if (!url) throw new Error("Cannnot get php url");
    return promisify((new AdmZip(await saveFile(url))).extractAllToAsync)(serverPath, false, true);
  } else {
    const fileTest = RegExp(`${process.platform.toLowerCase()}.*${process.arch.toLowerCase()}`);
    const file = releases.find(re => fileTest.test(re.name.toLowerCase()));
    if (file) {
      if (/\.zip/.test(file.name)) await promisify((new AdmZip(await saveFile(file.browser_download_url))).extractAllToAsync)(serverPath, false, true);
      else await tarExtract(file.browser_download_url, {folderPath: path.join(serverPath, "bin")});

      // Update zts
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
  await execFileAsync(await findPhp(serverPath), ["-v"]).catch(err => {
    console.warn(String(err));
    return buildPhp(serverPath, buildFolder);
  });
}

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  platformOptions.withBuildFolder = true;
  const { serverPath, buildFolder } = await pathControl("pocketmine", platformOptions);
  await installPhp(serverPath, buildFolder);
  const info = await platformManeger.pocketmine.find(version);
  await saveFile(info?.url, {filePath: path.join(serverPath, "pocketmine.phar")});
  return info;
}

export const portListen = /\[.*\]:\s+Minecraft\s+network\s+interface\s+running\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|\[[A-Za-z0-9:]+\]|):([0-9]+))/;
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const player = /[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi;
export const pocketmineHooks: globalPlatfroms.actionsV2 = {
  serverStarted(data, done) {
    // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
    if (started.test(data)) done(new Date());
  },
  portListening(data, done) {
    const portParse = data.match(portListen);
    if (!portParse) return;
    const [,, host, port] = portParse;
    done({
      protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
      type: "UDP",
      port: parseInt(port),
      host: host?.trim()
    });
  },
  stopServer(components) {
    components.actions.runCommand("stop");
    return components.actions.waitExit();
  },
};

export async function startServer(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, logsPath, id } = await pathControl("pocketmine", platformOptions);
  const serverPhar = path.join(serverPath, "pocketmine.phar");
  if (!fsExistsSync(serverPhar)) throw new Error("Install server fist!");
  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.stdout.log`);
  return globalPlatfroms.actionV2({
    id, platform: "pocketmine",
    processConfig: {command: await findPhp(serverPath), args: [serverPhar, "--no-wizard", "--enable-ansi"], options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: pocketmineHooks
  });
}