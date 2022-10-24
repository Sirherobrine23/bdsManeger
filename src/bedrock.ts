import path from "node:path";
import fsOld from "node:fs";
import fs from "node:fs/promises";
import * as globalPlatfroms from "./globalPlatfroms";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import { commendExists } from "./lib/childPromisses";
import * as httpRequest from "./lib/httpRequest";
import extendsFs, { exists, readdirrecursive } from "./lib/extendsFs";
import { randomPort } from "./lib/randomPort";
import { manegerConfigProprieties } from "./configManipulate";

// RegExp
export const saveFileFolder = /^(worlds|server\.properties|config|((permissions|allowlist|valid_known_packs)\.json)|(development_.*_packs))$/;
export const portListen = /\[.*\]\s+(IPv[46])\s+supported,\s+port:\s+([0-9]+)/;
export const started = /\[.*\]\s+Server\s+started\./;
export const player = /\[.*\]\s+Player\s+((dis|)connected):\s+(.*),\s+xuid:\s+([0-9]+)/;

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, serverRoot, platformIDs, id } = await pathControl("bedrock", platformOptions);
  const bedrockData = await platformManeger.bedrock.find(version);
  let platform = process.platform;
  if (platform === "android") platform = "linux";
  const url = bedrockData?.url[platform];
  if (!url) throw new Error("No url to current os platform");

  // Remover files
  await fs.readdir(serverPath).then(files => Promise.all(files.filter(file => !saveFileFolder.test(file)).map(file => fs.rm(path.join(serverPath, file), {recursive: true, force: true}))));

  const serverConfigProperties = (await fs.readFile(path.join(serverPath, "server.properties"), "utf8").catch(() => "")).trim();
  await httpRequest.extractZip({url, folderTarget: serverPath});
  if (serverConfigProperties) await fs.writeFile(path.join(serverPath, "server.properties"), serverConfigProperties);
  await fs.writeFile(path.join(serverRoot, "version_installed.json"), JSON.stringify({version: bedrockData.version, date: bedrockData.date, installDate: new Date()}));

  if (platformIDs.length > 1) {
    let v4: number, v6: number;
    const platformPorts = (await Promise.all(platformIDs.map(async id =>(await serverConfig({id})).getConfig()))).map(config => ({v4: config["server-port"], v6: config["server-portv6"]}));
    while (!v4||!v6) {
      const tmpNumber = await randomPort();
      if (platformPorts.some(ports => ports.v4 === tmpNumber||ports.v6 == tmpNumber)) continue;
      if (!v4) v4 = tmpNumber;
      else v6 = tmpNumber;
    };
    await (await serverConfig({id})).editConfig({name: "serverPort", data: v4}).editConfig({name: "serverPortv6", data: v6}).save()
  }
  return {
    id, url,
    version: bedrockData.version,
    date: bedrockData.date
  };
}

export async function startServer(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, logsPath, id } = await pathControl("bedrock", platformOptions);
  if (!fsOld.existsSync(path.join(serverPath, "bedrock_server"+(process.platform==="win32"?".exe":"")))) throw new Error("Install server fist");
  const args: string[] = [];
  let command = path.join(serverPath, "bedrock_server");
  if ((["android", "linux"]).includes(process.platform) && process.arch !== "x64") {
    args.push(command);
    if (await commendExists("qemu-x86_64-static")) command = "qemu-x86_64-static";
    else if (await commendExists("qemu-x86_64")) command = "qemu-x86_64";
    else if (await commendExists("box64")) command = "box64";
    else throw new Error("Cannot emulate x64 architecture. Check the documentents in \"https://github.com/The-Bds-Maneger/Bds-Maneger-Core/wiki/Server-Platforms#minecraft-bedrock-server-alpha\"");
  }
  const backendStart = new Date();
  const logFileOut = path.join(logsPath, `${backendStart.getTime()}_${process.platform}_${process.arch}.log`);
  const serverConfig: globalPlatfroms.actionsV2 = {
    serverStarted(data, done) {
      if (started.test(data)) done({
        onAvaible: new Date(),
        timePassed: Date.now() - backendStart.getTime()
      });
    },
    portListening(data, done) {
      const match = data.match(portListen);
      if (!match) return;
      const [, protocol, port] = match;
      const portData: globalPlatfroms.portListen = {port: parseInt(port), type: "UDP", host: protocol?.trim() === "IPv4" ? "127.0.0.1" : protocol?.trim() === "IPv6" ? "[::]" : "Unknown", protocol: protocol?.trim() === "IPv4" ? "IPv4" : protocol?.trim() === "IPv6" ? "IPv6" : "Unknown"};
      done(portData);
    },
    playerAction(data, playerConnect, playerDisconnect, playerUnknown) {
      if (player.test(data)) {
        const [, action,, playerName, xuid] = data.match(player);
        if (action === "connect") playerConnect({connectTime: new Date(), playerName: playerName, xuid});
        else if (action === "disconnect") playerDisconnect({connectTime: new Date(), playerName: playerName, xuid});
        else playerUnknown({connectTime: new Date(), playerName: playerName, xuid});
      }
    },
    stopServer(components) {
      components.actions.runCommand("stop");
      return components.actions.waitExit();
    },
    playerTp(actions, playerName, x, y, z) {
      if (!/".*"/.test(playerName) && playerName.includes(" ")) playerName = `"${playerName}"`;
      actions.runCommand("tp", playerName, x, y, z);
    },
  };
  return globalPlatfroms.actionV2({
    id,
    platform: "bedrock",
    processConfig: {command, args, options: {cwd: serverPath, maxBuffer: Infinity, env: {LD_LIBRARY_PATH: process.platform === "win32"?undefined:serverPath}, logPath: {stdout: logFileOut}}},
    hooks: serverConfig
  });
}

export type editConfig =
{name: "serverName", data: string}|
{name: "gamemode", data: "survival"|"creative"|"adventure"}|
{name: "forceGamemode", data: boolean}|
{name: "difficulty", data: "peaceful"|"easy"|"normal"|"hard"}|
{name: "allowCheats", data: boolean}|
{name: "maxPlayers", data: number}|
{name: "onlineMode", data: boolean}|
{name: "allowList", data: boolean}|
{name: "serverPort", data: number}|
{name: "serverPortv6", data: number}|
{name: "viewDistance", data: number}|
{name: "tickDistance", data: "4"|"6"|"8"|"10"|"12"}|
{name: "playerIdleTimeout", data: number}|
{name: "maxThreads", data: number}|
{name: "levelName", data: string}|
{name: "levelSeed", data?: string}|
{name: "defaultPlayerPermissionLevel", data: "visitor"|"member"|"operator"}|
{name: "texturepackRequired", data: boolean}|
{name: "chatRestriction", data: "None"|"Dropped"|"Disabled"}|
{name: "mojangTelemetry", data: boolean};

export type bedrockConfig = {
  "server-name": string,
  "gamemode": "survival"|"creative"|"adventure",
  "force-gamemode": boolean,
  "difficulty": "peaceful"|"easy"|"normal"|"hard",
  "allow-cheats": boolean,
  "max-players": number,
  "online-mode": true,
  "allow-list": boolean,
  "server-port": number,
  "server-portv6": number,
  "view-distance": number,
  "tick-distance": "4"|"6"|"8"|"10"|"12",
  "player-idle-timeout": number,
  "max-threads": number,
  "level-name": string,
  "level-seed": any,
  "default-player-permission-level": "visitor"|"member"|"operator",
  "texturepack-required": boolean,
  "content-log-file-enabled": boolean,
  "compression-threshold": number,
  "server-authoritative-movement": string,
  "player-movement-score-threshold": number,
  "player-movement-action-direction-threshold": number,
  "player-movement-distance-threshold": number,
  "player-movement-duration-threshold-in-ms": number,
  "correct-player-movement": boolean,
  "server-authoritative-block-breaking": boolean,
  "chat-restriction": "None"|"Dropped"|"Disabled",
  "disable-player-interaction": boolean,
  "emit-server-telemetry"?: boolean
}

export async function serverConfig(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const fileProperties = path.join(serverPath, "server.properties");
  if (!await extendsFs.exists(fileProperties)) await fs.cp(path.join(__dirname, "../configs/java/server.properties"), fileProperties);
  return manegerConfigProprieties<editConfig, bedrockConfig>({
    configPath: fileProperties,
    configManipulate: {
      serverName: {
        regexReplace: /server-name=.*/,
        valueFormat: "server-name=%s"
      },
      gamemode: {
        regexReplace: /gamemode=(survival|creative|adventure)/,
        valueFormat: "gamemode=%s"
      },
      forceGamemode: {
        regexReplace: /force-gamemode=(true|false)/,
        valueFormat: "force-gamemode=%s"
      },
      difficulty: {
        regexReplace: /difficulty=(peaceful|easy|normal|hard)/,
        valueFormat: "difficulty=%s"
      },
      allowCheats: {
        regexReplace: /allow-cheats=(false|true)/,
        valueFormat: "allow-cheats=%s"
      },
      maxPlayers: {
        regexReplace: /max-players=[0-9]+/,
        valueFormat: "max-players=%s"
      },
      onlineMode: {
        regexReplace: /online-mode=(true|false)/,
        valueFormat: "online-mode=%s"
      },
      allowList: {
        regexReplace: /allow-list=(false|true)/,
        valueFormat: "allow-list=%s"
      },
      tickDistance: {
        regexReplace: /tick-distance=(4|6|8|10|12)/,
        valueFormat: "tick-distance=%f",
        validate(value: number) {return ([4,6,8,10,12]).includes(value);}
      },
      playerIdleTimeout: {
        regexReplace: /player-idle-timeout=[0-9]+/,
        valueFormat: "player-idle-timeout=%f"
      },
      maxThreads: {
        regexReplace: /max-threads=[0-9]+/,
        valueFormat: "max-threads=%f"
      },
      levelName: {
        regexReplace: /^level-name=[\s\w\S]+/,
        valueFormat: "level-name=%s"
      },
      levelSeed: {
        regexReplace: /level-seed=[0-9]+/,
        valueFormat: "level-seed=%f"
      },
      defaultPlayerPermissionLevel: {
        regexReplace: /default-player-permission-level=(visitor|member|operator)/,
        valueFormat: "default-player-permission-level=%s"
      },
      texturepackRequired: {
        regexReplace: /texturepack-required=(false|true)/,
        valueFormat: "texturepack-required=%s"
      },
      chatRestriction: {
        regexReplace: /chat-restriction=(None|Dropped|Disabled)/,
        valueFormat: "chat-restriction=%s"
      },
      viewDistance: {
        validate(value: number) {return value > 4},
        regexReplace: /view-distance=[0-9]+/,
        valueFormat: "view-distance=%f"
      },
      mojangTelemetry: {
        addIfNotExist: "chat-restriction=false",
        regexReplace: /chat-restriction=(true|false)/,
        valueFormat: "chat-restriction=%s"
      },
      serverPort: {
        regexReplace: /server-port=[0-9]+/,
        valueFormat: "server-port=%f"
      },
      serverPortv6: {
        regexReplace: /server-portv6=[0-9]+/,
        valueFormat: "server-portv6=%f"
      },
    }
  })
}

export type resourcePacks = {
  pack_id: string,
  version?: number[]
};

export type resourceManifest = {
  format_version?: 2,
  header: {
    uuid: string,
    name?: string,
    description?: string,
    version?: number[],
    min_engine_version?: number[]
  },
  modules?: {
    uuid: string,
    type: "resources",
    description?: string,
    version: number[]
  }[]
};

export async function addResourcePacksToWorld(resourceId: string, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const serverConfigObject = (await serverConfig(platformOptions)).getConfig();
  if (!await exists(path.join(serverPath, "worlds", serverConfigObject["level-name"], "world_resource_packs.json"))) await fs.writeFile(path.join(serverPath, "worlds", serverConfigObject["level-name"], "world_resource_packs.json"), "[]");
  const resourcesData: resourcePacks[] = JSON.parse(await fs.readFile(path.join(serverPath, "worlds", serverConfigObject["level-name"], "world_resource_packs.json"), "utf8"));
  const manifests: resourceManifest[] = await Promise.all((await readdirrecursive([path.join(serverPath, "resource_packs"), path.join(serverPath, "worlds", serverConfigObject["level-name"], "resource_packs")])).filter((file: string) => file.endsWith("manifest.json")).map(async (file: string) => JSON.parse(await fs.readFile(file, "utf8"))));
  const packInfo = manifests.find(pf => pf.header.uuid === resourceId);
  if (!packInfo) throw new Error("UUID to texture not installed in the server");
  if (resourcesData.includes({pack_id: resourceId})) throw new Error("Textura alredy installed in the World");
  resourcesData.push({pack_id: packInfo.header.uuid, version: packInfo.header.version});
  await fs.writeFile(path.join(serverPath, "worlds", serverConfigObject["level-name"], "world_resource_packs.json"), JSON.stringify(resourcesData, null, 2));
  return resourcesData;
}