import { createServerManeger, platformPathID, pathOptions, serverConfig } from "../serverManeger.js";
import { promises as fs, createWriteStream } from "node:fs";
import { oracleBucket } from "../lib/remote.js";
import { promisify } from "node:util";
import { pipeline } from "node:stream/promises";
import * as childPromisses from "../lib/childPromisses.js";
import coreUtils from "@sirherobrine23/coreutils";
import AdmZip from "adm-zip";
import path from "node:path";
import tar from "tar";

export type bedrockRootOption = pathOptions & {
  variant?: "oficial"|"Pocketmine-PMMP"|"Powernukkit"|"Cloudbust"
};

export const hostArchEmulate = Object.freeze([
  "qemu-x86_64-static",
  "qemu-x86_64",
  "box64"
]);

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
  const files = await coreUtils.Extends.readdir({folderPath: binFolder});
  const file = files.find((v) => v.endsWith("php.exe")||v.endsWith("php"));
  if (!file) throw new Error("PHP Bin not found");
  return file;
}

export async function installServer(version?: string, options?: bedrockRootOption) {
  options = {variant: "oficial", ...options};
  const serverPath = await platformPathID("bedrock", options);
  if (options?.variant === "Pocketmine-PMMP") {
    if (!version) version = "latest";
    const phpBin = ((await oracleBucket.listFiles()) as any[]).filter(({name}) => name.includes("php_bin/")).filter(({name}) => name.includes(process.platform) && name.includes(process.arch)).at(0);
    if (!phpBin) throw new Error("PHP Bin not found");
    const binFolder = path.join(serverPath.serverPath, "bin");
    if (await coreUtils.Extends.exists(binFolder)) await fs.rm(binFolder, {recursive: true});
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

    const rel = await (await coreUtils.http.Github.GithubManeger("pmmp", "PocketMine-MP")).getRelease();
    const relData = version.trim().toLowerCase() === "latest" ? rel.at(0) : rel.find((v) => v.tag_name === version.trim());
    if (!relData) throw new Error("Version not found");
    const phpAsset = relData.assets.find((a) => a.name.endsWith(".phar"))?.browser_download_url;
    if (!phpAsset) throw new Error("PHP asset not found");
    await coreUtils.http.large.saveFile({url: phpAsset, path: path.join(serverPath.serverPath, "PocketMine-MP.phar")});

    return {
      version: relData.tag_name,
      releaseDate: new Date(relData.published_at),
      release: (relData.prerelease ? "preview" : "stable") as "preview"|"stable",
      url: phpAsset,
      phpBin: phpBin.name,
    };
  } else if (options?.variant === "Powernukkit") {
    if (!version) version = "latest";
    const versions = await coreUtils.http.jsonRequest<{version: string, mcpeVersion: string, date: string, url: string, variantType: "snapshot"|"stable"}[]>("https://mcpeversion-static.sirherobrine23.org/powernukkit/all.json").then(data => data.body);
    const versionData = version.trim().toLowerCase() === "latest" ? versions.at(-1) : versions.find((v) => v.version === version.trim() || v.mcpeVersion === version.trim());
    if (!versionData) throw new Error("Version not found");
    const url = versionData.url;
    if (!url) throw new Error("Platform not supported");
    await coreUtils.http.large.saveFile({url, path: path.join(serverPath.serverPath, "server.jar")});
    return {
      version: versionData.version,
      mcpeVersion: versionData.mcpeVersion,
      variantType: versionData.variantType,
      releaseDate: new Date(versionData.date),
      url,
    };
  } else if (options?.variant === "Cloudbust") {
    await coreUtils.http.large.saveFile({
      url: "https://ci.opencollab.dev/job/NukkitX/job/Server/job/bleeding/lastSuccessfulBuild/artifact/target/Cloudburst.jar",
      path: path.join(serverPath.serverPath, "server.jar")
    });

    return {
      version: "bleeding",
      releaseDate: new Date(),
      release: "preview",
      url: "https://ci.opencollab.dev/job/NukkitX/job/Server/job/bleeding/lastSuccessfulBuild/artifact/target/Cloudburst.jar",
    };
  } else {
    if (!version) version = "latest";
    const versions = await coreUtils.http.jsonRequest<bedrockVersionJSON[]>("https://sirherobrine23.github.io/BedrockFetch/all.json").then(data => data.body);
    const versionData = version.trim().toLowerCase() === "latest" ? versions.at(-1) : versions.find((v) => v.version === version.trim());
    if (!versionData) throw new Error("Version not found");
    let currentPlatform = process.platform;
    if (currentPlatform === "android") currentPlatform = "linux";
    const url = versionData.url[currentPlatform]?.[process.arch];
    if (!url) throw new Error("Platform not supported");
    (await coreUtils.http.large.admZip(url)).zip.extractAllTo(serverPath.serverPath, true, true);
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
  } else if (options?.variant === "Powernukkit" || options?.variant === "Cloudbust") {
    serverExec.exec.exec = "java";
    serverExec.exec.args = [
      "-XX:+UseG1GC",
      "-XX:+ParallelRefProcEnabled",
      "-XX:MaxGCPauseMillis=200",
      "-XX:+UnlockExperimentalVMOptions",
      "-XX:+DisableExplicitGC",
      "-XX:+AlwaysPreTouch",
      "-XX:G1NewSizePercent=30",
      "-XX:G1MaxNewSizePercent=40",
      "-XX:G1HeapRegionSize=8M",
      "-XX:G1ReservePercent=20",
      "-XX:G1HeapWastePercent=5",
      "-XX:G1MixedGCCountTarget=4",
      "-XX:InitiatingHeapOccupancyPercent=15",
      "-XX:G1MixedGCLiveThresholdPercent=90",
      "-XX:G1RSetUpdatingPauseTimePercent=5",
      "-XX:SurvivorRatio=32",
      "-XX:+PerfDisableSharedMem",
      "-XX:MaxTenuringThreshold=1",
      "-Dusing.aikars.flags=https://mcflags.emc.gs",
      "-Daikars.new.flags=true",
      "-jar", "server.jar"
    ];
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