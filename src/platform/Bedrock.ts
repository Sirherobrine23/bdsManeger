import { createServerManeger, platformPathID, pathOptions, serverConfig } from "../serverManeger.js";
import { promises as fs, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import coreUtils, { childPromisses } from "@sirherobrine23/coreutils";
import { promisify } from "node:util";
import path from "node:path";
import tar from "tar";
import AdmZip from "adm-zip";

export type bedrockRootOption = pathOptions & {
  variant?: "oficial"|"Pocketmine-PMMP"|"Powernukkit"|"Cloudbust"
};

const oracleBucket = await coreUtils.oracleBucket("sa-saopaulo-1", "bdsFiles", "grwodtg32n4d", "0IKM-5KFpAF8PuWoVe86QFsF4sipU2rXfojpaOMEdf4QgFQLcLlDWgMSPHWmjf5W");
const hostArchEmulate = [
  "qemu-x86_64-static",
  "qemu-x86_64",
  "box64"
];

type bedrockVersionJSON = {
  version: string,
  date: Date,
  release?: "stable"|"preview",
  url: {
    [platform in NodeJS.Platform]?: {
      [arch in NodeJS.Architecture]?: string
    }
  }
};

async function getPHPBin(options?: bedrockRootOption) {
  options = {variant: "oficial", ...options};
  const serverPath = await platformPathID("bedrock", options);
  const binFolder = path.join(serverPath.serverPath, "bin");
  const files = await coreUtils.extendFs.readdir({folderPath: binFolder});
  const file = files.filter((v) => v.endsWith("php.exe")||v.endsWith("php")).at(0);
  if (!file) throw new Error("PHP Bin not found");
  return file;
}

export async function installServer(version: string, options?: bedrockRootOption) {
  options = {variant: "oficial", ...options};
  const serverPath = await platformPathID("bedrock", options);
  if (options?.variant === "Pocketmine-PMMP") {
    const phpBin = (await oracleBucket.fileList()).filter(({name}) => name.startsWith("/php_bin/")).filter(({name}) => name.includes(process.platform) && name.includes(process.arch)).at(0);
    if (!phpBin) throw new Error("PHP Bin not found");
    const binFolder = path.join(serverPath.serverPath, "bin");
    if (await coreUtils.extendFs.exists(binFolder)) await fs.rm(binFolder, {recursive: true});
    await fs.mkdir(binFolder);
    await pipeline(await oracleBucket.getFileStream(phpBin.name), createWriteStream(path.join(binFolder, "phpTmp")));

    if (phpBin.name.endsWith(".tar.gz")) {
      await tar.extract({
        file: path.join(binFolder, "phpTmp"),
        cwd: binFolder
      });
    } else if (phpBin.name.endsWith(".zip")) {
      await promisify((new AdmZip(path.join(binFolder, "phpTmp"))).extractAllToAsync)(binFolder, true, true);
    }
    await fs.rm(path.join(binFolder, "phpTmp"));
    const phpBinPath = await getPHPBin(options);
    await coreUtils.childPromisses.execFile(phpBinPath, ["--version"]);

    const rel = await (await coreUtils.httpRequestGithub("pmmp", "PocketMine-MP")).getRelease();
    const relData = version.trim().toLowerCase() === "latest" ? rel.at(0) : rel.find((v) => v.tag_name === version.trim());
    if (!relData) throw new Error("Version not found");
    const phpAsset = relData.assets.find((a) => a.name.endsWith(".phar"))?.browser_download_url;
    if (!phpAsset) throw new Error("PHP asset not found");
    await coreUtils.httpRequestLarge.saveFile({url: phpAsset, filePath: path.join(serverPath.serverPath, "PocketMine-MP.phar")});

    return {
      version: relData.tag_name,
      releaseDate: new Date(relData.published_at),
      release: (relData.prerelease ? "preview" : "stable") as "preview"|"stable",
      url: phpAsset,
      phpBin: phpBin.name,
    };
  } else if (options?.variant === "Powernukkit") {
    const versions = await coreUtils.httpRequest.fetchJSON<{version: string, mcpeVersion: string, date: string, url: string, variantType: "snapshot"|"stable"}[]>("https://mcpeversion-static.sirherobrine23.org/powernukkit/all.json");
    const versionData = version.trim().toLowerCase() === "latest" ? versions.at(-1) : versions.find((v) => v.version === version.trim() || v.mcpeVersion === version.trim());
    if (!versionData) throw new Error("Version not found");
    const url = versionData.url;
    if (!url) throw new Error("Platform not supported");
    await coreUtils.httpRequestLarge.saveFile({url, filePath: path.join(serverPath.serverPath, "server.jar")});
    return {
      version: versionData.version,
      mcpeVersion: versionData.mcpeVersion,
      variantType: versionData.variantType,
      releaseDate: new Date(versionData.date),
      url,
    };
  } else if (options?.variant === "Cloudbust") {
    throw new Error("Not implemented");
  } else {
    const versions = await coreUtils.httpRequest.fetchJSON<bedrockVersionJSON[]>("https://the-bds-maneger.github.io/BedrockFetch/all.json");
    const versionData = version.trim().toLowerCase() === "latest" ? versions.at(-1) : versions.find((v) => v.version === version.trim());
    if (!versionData) throw new Error("Version not found");
    let currentPlatform = process.platform;
    if (currentPlatform === "android") currentPlatform = "linux";
    const url = versionData.url[currentPlatform]?.[process.arch];
    if (!url) throw new Error("Platform not supported");
    await coreUtils.httpRequestLarge.extractZip({url, folderTarget: serverPath.serverPath});
    return {
      version: versionData.version,
      releaseDate: new Date(versionData.date),
      release: versionData.release ?? "stable",
      url: url
    }
  }
}

export async function startServer(options?: bedrockRootOption) {
  // Bad fix options
  options = {variant: "oficial", ...options};
  const serverPath = await platformPathID("bedrock", options);
  // Server Object
  const serverExec: serverConfig = {
    exec: {
      cwd: serverPath.serverPath,
    },
    actions: {}
  };

  if (options?.variant === "Pocketmine-PMMP") {
    serverExec.exec.exec = await getPHPBin();
    serverExec.exec.args = ["PocketMine-MP.phar", "--no-wizard"];
    serverExec.actions = {
      stopServer(child_process) {
        child_process.stdin.write("stop\n");
      },
      onStart(lineData, fnRegister) {
        if (!(lineData.includes("INFO") && lineData.includes("Done") && lineData.includes("help"))) return;
        const doneStart = new Date();
        fnRegister({
          serverAvaible: doneStart,
          bootUp: runStart.getTime() - doneStart.getTime()
        });
      },
    };
  } else if (options?.variant === "Powernukkit") {
  } else if (options?.variant === "Cloudbust") {
  } else {
    if (process.platform === "win32") serverExec.exec.exec = "bedrock_server.exe";
    else if (process.platform === "darwin") throw new Error("MacOS is not supported, run in Docker or Virtual Machine");
    else {
      serverExec.exec.exec = path.join(serverPath.serverPath, "bedrock_server");
      serverExec.exec.env = {
        LD_LIBRARY_PATH: serverPath.serverPath
      };
    }
    if ((["android", "linux"]).includes(process.platform) && process.arch !== "x64") {
      const exec = serverExec.exec.exec;
      serverExec.exec.exec = undefined;
      for (const command of hostArchEmulate) {
        if (await childPromisses.commandExists(command, true)) {
          serverExec.exec.args = [exec];
          serverExec.exec.exec = command;
          break;
        }
        if (!serverExec.exec.exec) throw new Error("No emulator found for this platform");
      }
    }

    const startTest = /\[.*\]\s+Server\s+started\./;
    // Server actions
    serverExec.actions = {
      stopServer(child_process) {
        child_process.stdin.write("stop\n");
      },
      onStart(lineData, fnRegister) {if (startTest.test(lineData)) fnRegister({serverAvaible: new Date()});},
      playerActions(lineData, fnRegister) {
        const playerActionsV1 = /\[.*\]\s+Player\s+((dis|)connected):\s+(.*),\s+xuid:\s+([0-9]+)/;
        const newPlayerActions = /\[.*INFO\]\s+Player\s+(Spawned|connected|disconnected):\s+([\s\S\w]+)\s+(xuid:\s+([0-9]+))?/;
        const connectTime = new Date();
        if (!(newPlayerActions.test(lineData)||playerActionsV1.test(lineData))) return;
        let playerName: string, action: string, xuid: string;
        if (newPlayerActions.test(lineData)) {
          const [, actionV2,, playerNameV2,, xuidV2] = lineData.match(newPlayerActions);
          playerName = playerNameV2;
          action = actionV2;
          xuid = xuidV2;
        } else {
          const [, actionV1,, playerNameV1, xuidV1] = lineData.match(newPlayerActions);
          playerName = playerNameV1;
          action = actionV1;
          xuid = xuidV1;
        }
        fnRegister({
          player: playerName,
          action: action === "Spawned" ? "spawned" : action === "connected" ? "join" : "leave",
          actionDate: connectTime,
          sessionID: serverPath.id,
          more: {
            xuid
          }
        });
      },
    };
  }

  const runStart = new Date();
  return createServerManeger(serverExec);
}