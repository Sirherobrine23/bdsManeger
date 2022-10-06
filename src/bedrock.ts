import path from "node:path";
import fsOld from "node:fs";
import fs from "node:fs/promises";
import admZip from "adm-zip";
import * as Proprieties from "./lib/Proprieties";
import * as globalPlatfroms from "./globalPlatfroms";
import { promisify } from "node:util";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import { commendExists } from "./lib/childPromisses";
import { saveFile } from "./lib/httpRequest";

// RegExp
export const saveFileFolder = /^(worlds|server\.properties|config|((permissions|allowlist|valid_known_packs)\.json)|(development_.*_packs))$/;
export const portListen = /\[.*\]\s+(IPv[46])\s+supported,\s+port:\s+([0-9]+)/;
export const started = /\[.*\]\s+Server\s+started\./;
export const player = /\[.*\]\s+Player\s+((dis|)connected):\s+(.*),\s+xuid:\s+([0-9]+)/;

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const bedrockData = await platformManeger.bedrock.find(version);
  const zip = new admZip(await saveFile(bedrockData?.url[process.platform]));
  // Remover files
  await fs.readdir(serverPath).then(files => files.filter(file => !saveFileFolder.test(file))).then(files => Promise.all(files.map(file => fs.rm(path.join(serverPath, file), {recursive: true, force: true}))));
  const serverConfig = (await fs.readFile(path.join(serverPath, "server.properties"), "utf8").catch(() => "")).trim();
  await promisify(zip.extractAllToAsync)(serverPath, true, true);
  if (serverConfig) await fs.writeFile(path.join(serverPath, "server.properties"), serverConfig);
  return {
    version: bedrockData.version,
    date: bedrockData.date,
    url: bedrockData.url[process.platform]
  };
}

const serverConfig: globalPlatfroms.actionsV2 = {
  serverStarted(data, done) {
    const resulter = data.match(started);
    if (resulter) done(new Date());
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

export async function startServer(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, logsPath, id } = await pathControl("bedrock", platformOptions);
  if (!fsOld.existsSync(path.join(serverPath, "bedrock_server"+(process.platform==="win32"?".exe":"")))) throw new Error("Install server fist");
  const args: string[] = [];
  let command = path.join(serverPath, "bedrock_server");
  if ((["android", "linux"]).includes(process.platform) && process.arch !== "x64") {
    args.push(command);
    if (await commendExists("qemu-x86_64-static")) command = "qemu-x86_64-static";
    if (await commendExists("qemu-x86_64")) command = "qemu-x86_64";
    else if (await commendExists("box64")) command = "box64";
    else throw new Error("Cannot emulate x64 architecture. Check the documentents in \"https://github.com/The-Bds-Maneger/Bds-Maneger-Core/wiki/Server-Platforms#minecraft-bedrock-server-alpha\"");
  }

  // Fix Libssl, https://bugs.mojang.com/browse/BDS-16913
  // if (process.platform === "linux") {
  //   execAsync(`echo "deb http://security.ubuntu.com/ubuntu focal-security main" | sudo tee /etc/apt/sources.list.d/focal-security.list && sudo apt update && sudo apt install libssl1.1`, {stdio: "inherit"});
  // }

  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.log`);
  return globalPlatfroms.actionV2({
    id,
    platform: "bedrock",
    processConfig: {command, args, options: {cwd: serverPath, maxBuffer: Infinity, env: {LD_LIBRARY_PATH: process.platform === "win32"?undefined:serverPath}, logPath: {stdout: logFileOut}}},
    hooks: serverConfig
  });
}

// Update file config
export type keyConfig = "serverName"|"gamemode"|"forceGamemode"|"difficulty"|"allowCheats"|"maxPlayers"|"onlineMode"|"allowList"|"serverPort"|"serverPortv6"|"viewDistance"|"tickDistance"|"playerIdleTimeout"|"maxThreads"|"levelName"|"levelSeed"|"defaultPlayerPermissionLevel"|"texturepackRequired"|"chatRestriction"|"mojangTelemetry";
export async function updateConfig(key: "serverName", value: string): Promise<string>;
export async function updateConfig(key: "gamemode", value: "survival"|"creative"|"adventure"): Promise<string>;
export async function updateConfig(key: "forceGamemode", value: boolean): Promise<string>;
export async function updateConfig(key: "difficulty", value: "peaceful"|"easy"|"normal"|"hard"): Promise<string>;
export async function updateConfig(key: "allowCheats", value: boolean): Promise<string>;
export async function updateConfig(key: "maxPlayers", value: number): Promise<string>;
export async function updateConfig(key: "onlineMode", value: boolean): Promise<string>;
export async function updateConfig(key: "allowList", value: boolean): Promise<string>;
export async function updateConfig(key: "serverPort", value: number): Promise<string>;
export async function updateConfig(key: "serverPortv6", value: number): Promise<string>;
export async function updateConfig(key: "viewDistance", value: number): Promise<string>;
export async function updateConfig(key: "tickDistance", value: "4"|"6"|"8"|"10"|"12"): Promise<string>;
export async function updateConfig(key: "playerIdleTimeout", value: number): Promise<string>;
export async function updateConfig(key: "maxThreads", value: number): Promise<string>;
export async function updateConfig(key: "levelName", value: string): Promise<string>;
export async function updateConfig(key: "levelSeed", value?: string): Promise<string>;
export async function updateConfig(key: "defaultPlayerPermissionLevel", value: "visitor"|"member"|"operator"): Promise<string>;
export async function updateConfig(key: "texturepackRequired", value: boolean): Promise<string>;
export async function updateConfig(key: "chatRestriction", value: "None"|"Dropped"|"Disabled"): Promise<string>;
export async function updateConfig(key: "mojangTelemetry", value: boolean): Promise<string>;
export async function updateConfig(key: keyConfig, value: string|number|boolean, platformOptions: bdsPlatformOptions = {id: "default"}): Promise<string> {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const fileProperties = path.join(serverPath, "server.properties");
  if (!fsOld.existsSync(fileProperties)) throw new Error("Install server fist!");
  let fileConfig = await fs.readFile(fileProperties, "utf8");
  if (key === "serverName") fileConfig = fileConfig.replace(/server-name=.*/, `server-name=${value}`);
  else if (key === "gamemode") fileConfig = fileConfig.replace(/gamemode=(survival|creative|adventure)/, `gamemode=${value}`);
  else if (key === "forceGamemode") fileConfig = fileConfig.replace(/force-gamemode=(true|false)/, `force-gamemode=${value}`);
  else if (key === "difficulty") fileConfig = fileConfig.replace(/difficulty=(peaceful|easy|normal|hard)/, `difficulty=${value}`);
  else if (key === "allowCheats") fileConfig = fileConfig.replace(/allow-cheats=(false|true)/, `allow-cheats=${value}`);
  else if (key === "maxPlayers") fileConfig = fileConfig.replace(/max-players=[0-9]+/, `max-players=${value}`);
  else if (key === "onlineMode") fileConfig = fileConfig.replace(/online-mode=(true|false)/, `online-mode=${value}`);
  else if (key === "allowList") fileConfig = fileConfig.replace(/allow-list=(false|true)/, `allow-list=${value}`);
  else if (key === "serverPort"||key === "serverPortv6") {
    if (value > 1 && 65535 < value) {
      if (key === "serverPort") fileConfig = fileConfig.replace(/server-port=[0-9]+/, `server-port=${value}`);
      else fileConfig = fileConfig.replace(/server-portv6=[0-9]+/, `server-portc6=${value}`);
    } else throw new Error("Invalid port range");
  }
  else if (key === "viewDistance") {
    if (value > 4) fileConfig = fileConfig.replace(/view-distance=[0-9]+/, `view-distance=${value}`);
    else throw new Error("integer equal to 5 or greater");
  } else if (key === "tickDistance") fileConfig = fileConfig.replace(/tick-distance=(4|6|8|10|12)/, `tick-distance=${value}`);
  else if (key === "playerIdleTimeout") fileConfig = fileConfig.replace(/player-idle-timeout=[0-9]+/, `player-idle-timeout=${value}`);
  else if (key === "maxThreads") fileConfig = fileConfig.replace(/max-threads=[0-9]+/, `max-threads=${value}`);
  else if (key === "levelName") fileConfig = fileConfig.replace(/level-name=.*/, `level-name=${value}`);
  else if (key === "levelSeed") fileConfig = fileConfig.replace(/level-seed=.*/, `level-seed=${!value?"":value}`);
  else if (key === "defaultPlayerPermissionLevel") fileConfig = fileConfig.replace(/default-player-permission-level=(visitor|member|operator)/, `default-player-permission-level=${value}`);
  else if (key === "texturepackRequired") fileConfig = fileConfig.replace(/texturepack-required=(false|true)/, `texturepack-required=${value}`);
  else if (key === "chatRestriction") fileConfig = fileConfig.replace(/chat-restriction=(None|Dropped|Disabled)/, `chat-restriction=${value}`);
  else if (key === "mojangTelemetry") {
    if (!fileConfig.includes("emit-server-telemetry")) fileConfig = fileConfig.trim()+`\nemit-server-telemetry=false\n`;
    fileConfig = fileConfig.replace(/chat-restriction=(true|false)/, `nemit-server-telemetry=${value}`);
  }
  else throw new Error("Invalid key");

  await fs.writeFile(fileProperties, fileConfig);
  return fileConfig;
}

export type bedrockConfig = {
  "serverName"?: string,
  "gamemode"?: "survival"|"creative"|"adventure",
  "forceGamemode"?: boolean,
  "difficulty"?: "peaceful"|"easy"|"normal"|"hard",
  "allowCheats"?: boolean,
  "maxPlayers"?: number,
  "onlineMode"?: boolean,
  "allowList"?: boolean,
  "serverPort"?: number,
  "serverPortv6"?: number,
  "viewDistance"?: number,
  "tickDistance"?: "4"|"6"|"8"|"10"|"12",
  "playerIdleTimeout"?: number,
  "maxThreads"?: number,
  "levelName"?: string,
  "levelSeed"?: string,
  "defaultPlayerPermissionLevel"?: "visitor"|"member"|"operator",
  "texturepackRequired"?: boolean,
  "chatRestriction"?: "None"|"Dropped"|"Disabled",
  "mojangTelemetry"?: boolean
};

type rawConfig = {
  "server-name": string,
  gamemode: string,
  "force-gamemode": boolean,
  difficulty: string,
  "allow-cheats": boolean,
  "max-players": number,
  "online-mode": true,
  "allow-list": boolean,
  "server-port": number,
  "server-portv6": number,
  "view-distance": number,
  "tick-distance": number,
  "player-idle-timeout": number,
  "max-threads": number,
  "level-name": string,
  "level-seed": any,
  "default-player-permission-level": string,
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
  "chat-restriction": string,
  "disable-player-interaction": boolean,
  "emit-server-telemetry"?: boolean
}

export async function getConfig(platformOptions: bdsPlatformOptions = {id: "default"}): Promise<bedrockConfig> {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const fileProperties = path.join(serverPath, "server.properties");
  if (!fsOld.existsSync(fileProperties)) throw new Error("Install server fist");
  const config = Proprieties.parse<rawConfig>(await fs.readFile(fileProperties, "utf8"));
  const configBase: bedrockConfig = {};
  const ignore = [
    "content-log-file-enabled", "compression-threshold", "server-authoritative-movement", "player-movement-score-threshold", "player-movement-action-direction-threshold",
    "player-movement-distance-threshold", "player-movement-duration-threshold-in-ms", "correct-player-movement", "server-authoritative-block-breaking", "disable-player-interaction"
  ]
  for (const configKey of Object.keys(config)) {
    if (ignore.includes(configKey)) continue;
    const key = configKey.replace(/-(.)/g, (_, _1) => _1.toUpperCase());
    if (key === "levelSeed" && config[configKey] === null) configBase[key] = "";
    else configBase[key] = config[configKey];
  }
  return configBase;
}