import * as path from "node:path";
import * as fsOld from "node:fs";
import * as fs from "node:fs/promises";
import { promisify } from "node:util";
import { platformManeger } from "@the-bds-maneger/server_versions";
import admZip from "adm-zip";
import { exec, execAsync } from "./childPromisses";
import { actions, actionConfig } from "./globalPlatfroms";
import { serverRoot, logRoot } from './pathControl';
import * as Proprieties from "./Proprieties";
export const serverPath = path.join(serverRoot, "Bedrock");
export { bedrockServerWorld, bedrockWorld, linkBedrock } from "./linkWorld";

// RegExp
export const saveFileFolder = /^(worlds|server\.properties|config|((permissions|allowlist|valid_known_packs)\.json)|(development_.*_packs))$/;
export const portListen = /\[.*\]\s+(IPv[46])\s+supported,\s+port:\s+([0-9]+)/;
export const started = /\[.*\]\s+Server\s+started\./;
// [2022-08-30 20:50:53:821 INFO] Player connected: Sirherobrine, xuid: 111111111111111
// [2022-08-30 20:56:55:231 INFO] Player disconnected: Sirherobrine, xuid: 111111111111111
export const player = /\[.*\]\s+Player\s+((dis|)connected):\s+(.*),\s+xuid:\s+([0-9]+)/;
// [2022-08-30 20:56:55:601 INFO] Running AutoCompaction...
export const compressWorld = /\[.*\]\s+Running\s+AutoCompaction/;

export async function installServer(version: string|boolean) {
  const zip = new admZip(await platformManeger.bedrock.getBedrockZip(version, {}));
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  // Remover files
  for (const file of await fs.readdir(serverPath).then(files => files.filter(file => !saveFileFolder.test(file)))) await fs.rm(path.join(serverPath, file), {recursive: true, force: true});
  const serverConfig = (await fs.readFile(path.join(serverPath, "server.properties"), "utf8").catch(() => "")).trim();
  await promisify(zip.extractAllToAsync)(serverPath, true, true);
  if (serverConfig) await fs.writeFile(path.join(serverPath, "server.properties"), serverConfig);
}

const serverConfig: actionConfig[] = [
  {
    name: "portListening",
    callback(data, done) {
      const match = data.match(portListen);
      if (!match) return;
      const [, protocol, port] = match;
      done({port: parseInt(port), type: "UDP", host: "127.0.0.1", protocol: protocol?.trim() === "IPv4" ? "IPv4" : protocol?.trim() === "IPv6" ? "IPv6" : "Unknown"});
    }
  },
  {
    name: "serverStarted",
    callback(data, done) {
      const resulter = data.match(started);
      if (resulter) done(new Date());
    },
  },
  {
    name: "playerConnect",
    callback(data, done) {
      const match = data.match(player);
      if (!match) return;
      const [, action,, playerName, xuid] = match;
      if (action === "connect") done({connectTime: new Date(), playerName: playerName, xuid});
    }
  },
  {
    name: "playerDisconnect",
    callback(data, done) {
      const match = data.match(player);
      if (!match) return;
      const [, action,, playerName, xuid] = match;
      if (action === "disconnect") done({connectTime: new Date(), playerName: playerName, xuid});
    }
  },
  {
    name: "playerUnknown",
    callback(data, done) {
      const match = data.match(player);
      if (!match) return;
      const [, action,, playerName, xuid] = match;
      if (!(action === "disconnect" || action === "connect")) done({connectTime: new Date(), playerName: playerName, xuid});
    }
  },
  {
    name: "serverStop",
    run: (child) => child.writeStdin("stop")
  }
];

export async function startServer() {
  if (!fsOld.existsSync(serverPath)) throw new Error("Install server fist");
  const args: string[] = [];
  let command = path.join(serverPath, "bedrock_server");
  if (process.platform === "linux" && process.arch !== "x64") {
    args.push(command);
    if (await execAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false)) command = "qemu-x86_64-static";
    else if (await execAsync("command -v box64").then(() => true).catch(() => false)) command = "box64";
    else throw new Error("Cannot emulate x64 architecture. Check the documentents in \"https://github.com/The-Bds-Maneger/Bds-Maneger-Core/wiki/Server-Platforms#minecraft-bedrock-server-alpha\"");
  }

  // Fix Libssl, https://bugs.mojang.com/browse/BDS-16913
  // if (process.platform === "linux") {
  //   execAsync(`echo "deb http://security.ubuntu.com/ubuntu focal-security main" | sudo tee /etc/apt/sources.list.d/focal-security.list && sudo apt update && sudo apt install libssl1.1`, {stdio: "inherit"});
  // }

  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_bedrock_${process.platform}_${process.arch}.stdout.log`);
  return new actions(exec(command, args, {cwd: serverPath, maxBuffer: Infinity, env: {LD_LIBRARY_PATH: process.platform === "win32"?undefined:serverPath}, logPath: {stdout: logFileOut}}), serverConfig);
}

// File config
export const fileProperties = path.join(serverPath, "server.properties");

// Update file config
export type keyConfig = "serverName"|"gamemode"|"forceGamemode"|"difficulty"|"allowCheats"|"maxPlayers"|"onlineMode"|"allowList"|"serverPort"|"serverPortv6"|"viewDistance"|"tickDistance"|"playerIdleTimeout"|"maxThreads"|"levelName"|"levelSeed"|"defaultPlayerPermissionLevel"|"texturepackRequired"|"chatRestriction";
export async function updateFile(key: "serverName", value: string): Promise<string>;
export async function updateFile(key: "gamemode", value: "survival"|"creative"|"adventure"): Promise<string>;
export async function updateFile(key: "forceGamemode", value: boolean): Promise<string>;
export async function updateFile(key: "difficulty", value: "peaceful"|"easy"|"normal"|"hard"): Promise<string>;
export async function updateFile(key: "allowCheats", value: boolean): Promise<string>;
export async function updateFile(key: "maxPlayers", value: number): Promise<string>;
export async function updateFile(key: "onlineMode", value: boolean): Promise<string>;
export async function updateFile(key: "allowList", value: boolean): Promise<string>;
export async function updateFile(key: "serverPort", value: number): Promise<string>;
export async function updateFile(key: "serverPortv6", value: number): Promise<string>;
export async function updateFile(key: "viewDistance", value: number): Promise<string>;
export async function updateFile(key: "tickDistance", value: "4"|"6"|"8"|"10"|"12"): Promise<string>;
export async function updateFile(key: "playerIdleTimeout", value: number): Promise<string>;
export async function updateFile(key: "maxThreads", value: number): Promise<string>;
export async function updateFile(key: "levelName", value: string): Promise<string>;
export async function updateFile(key: "levelSeed", value?: string): Promise<string>;
export async function updateFile(key: "defaultPlayerPermissionLevel", value: "visitor"|"member"|"operator"): Promise<string>;
export async function updateFile(key: "texturepackRequired", value: boolean): Promise<string>;
export async function updateFile(key: "chatRestriction", value: "None"|"Dropped"|"Disabled"): Promise<string>;
export async function updateFile(key: keyConfig, value: string|number|boolean): Promise<string> {
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
  "chatRestriction"?: "None"|"Dropped"|"Disabled"
};

type rawConfig = {
  'server-name': string,
  gamemode: string,
  'force-gamemode': boolean,
  difficulty: string,
  'allow-cheats': boolean,
  'max-players': number,
  'online-mode': true,
  'allow-list': boolean,
  'server-port': number,
  'server-portv6': number,
  'view-distance': number,
  'tick-distance': number,
  'player-idle-timeout': number,
  'max-threads': number,
  'level-name': string,
  'level-seed': any,
  'default-player-permission-level': string,
  'texturepack-required': boolean,
  'content-log-file-enabled': boolean,
  'compression-threshold': number,
  'server-authoritative-movement': string,
  'player-movement-score-threshold': number,
  'player-movement-action-direction-threshold': number,
  'player-movement-distance-threshold': number,
  'player-movement-duration-threshold-in-ms': number,
  'correct-player-movement': boolean,
  'server-authoritative-block-breaking': boolean,
  'chat-restriction': string,
  'disable-player-interaction': boolean
}

export async function getConfig(): Promise<bedrockConfig> {
  if (!fsOld.existsSync(fileProperties)) throw new Error("Install server fist");
  const config = Proprieties.parse<rawConfig>(await fs.readFile(fileProperties, "utf8"));
  const configBase: bedrockConfig = {};
  const ignore = [
    "content-log-file-enabled",
    "compression-threshold",
    "server-authoritative-movement",
    "player-movement-score-threshold",
    "player-movement-action-direction-threshold",
    "player-movement-distance-threshold",
    "player-movement-duration-threshold-in-ms",
    "correct-player-movement",
    "server-authoritative-block-breaking",
    "disable-player-interaction"
  ]
  for (const configKey of Object.keys(config)) {
    if (ignore.includes(configKey)) continue;
    const key = configKey.replace(/-(.)/g, (_, _1) => _1.toUpperCase());
    if (key === "levelSeed" && config[configKey] === null) configBase[key] = "";
    else configBase[key] = config[configKey];
  }
  return configBase;
}