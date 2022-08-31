import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as tar from "tar";
import { existsSync as  fsExistsSync } from "node:fs";
import { getPocketminePhar, versionAPIs } from "@the-bds-maneger/server_versions";
import { execFileAsync, exec } from './childPromisses';
import { serverRoot } from "./pathControl";
import { getBuffer } from "./httpRequest";
import { actionConfig, actions } from './globalPlatfroms';
import AdmZip from "adm-zip";
import { promisify } from 'node:util';
export { pocketmineServerWorld, pocketmineWorld, linkPocketmine } from "./linkWorlds/bedrock_pocketmine";
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
  if (process.platform === "win32") throw new Error("Script is to Linux and MacOS");
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  const tempFolder = path.join(os.tmpdir(), "bdsPhp_"+(Math.random()*19999901).toString(16).replace(".", "").replace(/[0-9]/g, (_, a) =>a=="1"?"a":a=="2"?"b":a=="3"?"S":"k"));
  if (!fsExistsSync(tempFolder)) fs.mkdir(tempFolder, {recursive: true});
  await fs.writeFile(path.join(tempFolder, "build.sh"), await getBuffer("https://raw.githubusercontent.com/pmmp/php-build-scripts/stable/compile.sh"));
  await fs.chmod(path.join(tempFolder, "build.sh"), "777");
  console.info("Building PHP!");
  await execFileAsync(path.join(tempFolder, "build.sh"), ["-j"+os.cpus().length], {cwd: tempFolder, stdio: "inherit"});
  await fs.cp(path.join(tempFolder, "bin", (await fs.readdir(path.join(tempFolder, "bin")))[0]), path.join(serverPath, "bin"), {force: true, recursive: true, preserveTimestamps: true, verbatimSymlinks: true});
  console.log("PHP Build success!");
}

async function installPhp(): Promise<void> {
  const file = (await getBuffer(`${versionAPIs[0]}/pocketmine/bin?os=${process.platform}&arch=${process.arch}`).then(res => JSON.parse(res.toString("utf8")) as {url: string, name: string}[]))[0];
  if (!file) return buildPhp();
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  await fs.mkdir(path.resolve(serverPath, "bin"), {recursive: true});
  // Tar.gz
  if (/tar\.gz/.test(file.name)) {
    await fs.writeFile(path.join(os.tmpdir(), file.name), await getBuffer(file.url));
    await tar.extract({file: path.join(os.tmpdir(), file.name), C: path.join(serverPath, "bin"), keep: true, p: true, noChmod: false});
  } else {
    const zip = new AdmZip(await getBuffer(file.url));
    await promisify(zip.extractAllToAsync)(serverPath, false, true);
  }
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
  // test it's works php
  await fs.writeFile(path.join(os.tmpdir(), "test.php"), `<?php echo "Hello World";`);
  await execFileAsync(phpBinPath, ["-f", path.join(os.tmpdir(), "test.php")]).catch(buildPhp);
}

export async function installServer(version: string|boolean) {
  if (!fsExistsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await installPhp();
  await fs.writeFile(serverPhar, await getPocketminePhar(version));
}

// [16:47:35.405] [Server thread/INFO]: Minecraft network interface running on 0.0.0.0:19132
export const portListen = /\[.*\]:\s+Minecraft\s+network\s+interface\s+running\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|\[[A-Za-z0-9:]+\]|):([0-9]+))/;
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const player = /[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi;

const serverConfig: actionConfig[] = [
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
    name: "serverStarted",
    callback(data, done) {
      // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
      if (started.test(data)) done(new Date());
    }
  },
  {
    name: "playerConnect",
    callback(data, done) {
      data;
    },
  },
  {
    name: "serverStop",
    run: (child) => child.writeStdin("stop")
  }
];

export async function startServer() {
  if (!fsExistsSync(serverPath)) throw new Error("Install server fist!");
  return new actions(exec(phpBinPath, [serverPhar], {cwd: serverPath, maxBuffer: Infinity}), serverConfig);
}