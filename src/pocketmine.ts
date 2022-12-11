import { customChildProcess, extendFs, httpRequest, httpRequestGithub, httpRequestLarge } from "@sirherobrine23/coreutils";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import { existsSync as fsExistsSync, Stats } from "node:fs";
import { promisify } from "node:util";
import * as globalPlatfroms from "./globalPlatfroms";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import AdmZip from "adm-zip";
const phpStaticBucket = "https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/0IKM-5KFpAF8PuWoVe86QFsF4sipU2rXfojpaOMEdf4QgFQLcLlDWgMSPHWmjf5W/n/grwodtg32n4d/b/bdsFiles/o/";

export async function listVersions() {
  return (await httpRequestGithub.GithubRelease("pmmp", "PocketMine-MP")).map(data => {
    const pharFile = data.assets.find(data => data.name.endsWith((".phar")));
    return {
      version: data.tag_name,
      publish: new Date(data.published_at),
      pharFile: pharFile?.browser_download_url,
      size: pharFile?.size
    };
  }).filter(rel => !!rel.pharFile);
}

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

async function installPhp(serverPath: string, buildFolder: string): Promise<void> {
  const objectsBucket = (await httpRequest.getJSON<{objects: {name: string}[]}>(phpStaticBucket)).objects.map(file => phpStaticBucket + file.name);
  if (fsExistsSync(path.resolve(serverPath, "bin"))) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  await fs.writeFile(path.join(os.tmpdir(), "bds_test.php"), `<?php echo "Hello World";`);
  if (process.platform === "win32") {
    let url: string = objectsBucket.filter(assert => assert.endsWith(".zip")).find(assert => /win32|windows/.test(assert));
    if (!url) throw new Error("Cannnot get php url");
    return promisify((new AdmZip(await httpRequestLarge.saveFile({url}))).extractAllToAsync)(serverPath, false, true);
  } else {
    const fileTest = RegExp(`${process.platform.toLowerCase()}.*${process.arch.toLowerCase()}`);
    const file = objectsBucket.find(re => fileTest.test(re.toLowerCase()));
    if (file) {
      if (/\.zip/.test(file)) await httpRequestLarge.extractZip({url: file, folderTarget: serverPath});
      else await httpRequestLarge.tarExtract({url: file, folderPath: path.join(serverPath, "bin")});

      // Update zts
      if (process.platform === "linux"||process.platform === "android"||process.platform === "darwin") {
        const ztsFind = (await extendFs.readdirrecursive(path.resolve(serverPath, "bin"))).filter(file => /.*debug-zts.*/.test(file));
        if (ztsFind.length > 0) {
          const phpIniPath = (await extendFs.readdirrecursive(path.resolve(serverPath, "bin"))).filter(file => file.endsWith("php.ini")).at(0);
          let phpIni = await fs.readFile(phpIniPath, "utf8");
          if (phpIni.includes("extension_dir")) await fs.writeFile(phpIniPath, phpIni.replace(/extension_dir=.*/g, ""));
          phpIni = phpIni+`\nextension_dir=${path.resolve(ztsFind.at(0), "..")}`
          await fs.writeFile(phpIniPath, phpIni);
        }
      }
    }
  }

  // test it's works php
  await customChildProcess.execFile(await findPhp(serverPath), ["-v"]).catch(err => {
    console.warn(String(err));
    throw new Error("Cannot find php release files");
  });
}

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  platformOptions.withBuildFolder = true;
  const { serverPath, buildFolder, id } = await pathControl("pocketmine", platformOptions);
  await installPhp(serverPath, buildFolder);
  if (typeof version === "boolean") version = "latest";
  if (version?.trim()?.toLowerCase() === "latest") version = (await listVersions()).at(0)?.version
  const info = (await listVersions()).find(rel => rel.version === version);
  await httpRequestLarge.saveFile({url: info?.pharFile, filePath: path.join(serverPath, "pocketmine.phar")});
  return {
    id,
    version: info.version,
    url: info.pharFile,
    date: info.publish
  };
}

export const portListen = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|\[[a-zA-Z0-9:]+\]):([0-9]+)/;
export const started = /Done[\s\W\S]+Help[\s\S\W]+\?/;
export const player = /[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi;
export const pocketmineHooks: globalPlatfroms.actionsV2 = {
  serverStarted(data, done) {
    // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
    if (started.test(data)) done(new Date());
  },
  portListening(data, done) {
    if (!portListen.test(data)) return;
    const [,, host, port] = data.match(portListen);
    done({
      type: "UDP",
      protocol: /\[[a-zA-Z0-9:]+\]/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
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
