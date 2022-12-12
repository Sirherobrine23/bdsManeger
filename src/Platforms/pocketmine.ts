import { childPromisses, extendFs, httpRequest, httpRequestGithub, httpRequestLarge } from "@sirherobrine23/coreutils";
import { pathControl, bdsPlatformOptions } from "../platformPathManeger.js";
import { existsSync as fsExistsSync, Stats } from "node:fs";
import * as globalPlatfroms from "../globalPlatfroms.js";
import path from "node:path";
import fs from "node:fs/promises";
import debug from "debug";
const pocketmineDebug = debug("bdscore:platform:pocketmine");
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

async function installPhp(serverPath: string): Promise<void> {
  let filePath = (await httpRequest.getJSON<{objects: {name: string}[]}>(phpStaticBucket)).objects.find(({name}) => name.includes(process.platform) && name.includes(process.arch))?.name;
  if (!filePath) {
    pocketmineDebug("Current OS: %s", process.platform);
    pocketmineDebug("Current Arch: %s", process.arch);
    throw new Error("Cannot find php release!");
  }
  const binFolder = path.resolve(serverPath, "bin");
  if (await extendFs.exists(binFolder)) await fs.rm(path.resolve(serverPath, "bin"), {recursive: true});
  filePath = phpStaticBucket+filePath;
  if (filePath.endsWith(".zip")) await httpRequestLarge.extractZip({url: filePath, folderTarget: binFolder});
  else if (filePath.endsWith(".tar.gz")||filePath.endsWith(".tgz")||filePath.endsWith(".tar")) await httpRequestLarge.tarExtract({url: filePath, folderPath: binFolder});
  else throw new Error("Invalid file: "+filePath);

  // test it's works php
  const phpExec = await findPhp(serverPath);
  if (!phpExec) throw new Error("Cannot find php exec file!");
  await childPromisses.execFile(phpExec, ["--version"]).catch(err => {
    pocketmineDebug("PHP bin error: %O", err);
    pocketmineDebug("Current OS: %s", process.platform);
    pocketmineDebug("Current Arch: %s", process.arch);
    throw new Error("Corrupt PHP in host!");
  });
}

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  platformOptions.withBuildFolder = true;
  const serverFolders = await pathControl("pocketmine", platformOptions);
  await installPhp(serverFolders.serverPath);
  if (typeof version === "boolean") version = "latest";
  if (version?.trim()?.toLowerCase() === "latest") version = (await listVersions()).at(0)?.version
  const info = (await listVersions()).find(rel => rel.version === version);
  await httpRequestLarge.saveFile({url: info?.pharFile, filePath: path.join(serverFolders.serverPath, "pocketmine.phar")});
  return {
    id: serverFolders.id,
    version: info.version,
    url: info.pharFile,
    date: info.publish
  };
}

const portListen = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|\[[a-zA-Z0-9:]+\]):([0-9]+)/;
// const player = /[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi;
export async function startServer(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, logsPath, id } = await pathControl("pocketmine", platformOptions);
  const serverPhar = path.join(serverPath, "pocketmine.phar");
  if (!fsExistsSync(serverPhar)) throw new Error("Install server fist!");
  const runStart = new Date();
  const logFileOut = path.join(logsPath, `${runStart.getTime()}_${process.platform}_${process.arch}.stdout.log`);
  const pocketmineHooks: globalPlatfroms.actionsV2 = {
    serverStarted(data, done) {
      if (!(data.includes("INFO") && data.includes("Done") && data.includes("help"))) return;
      const doneStart = new Date();
      done({
        onAvaible: doneStart,
        timePassed: runStart.getTime() - doneStart.getTime()
      });
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
  return globalPlatfroms.actionV2({
    id, platform: "pocketmine",
    processConfig: {command: await findPhp(serverPath), args: [serverPhar, "--no-wizard"], options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: pocketmineHooks
  });
}
