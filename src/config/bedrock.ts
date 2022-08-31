import { readFile } from "node:fs/promises";
import {} from "prismarine-nbt";
import { serverPath } from "../bedrock";
import * as Proprieties from "./Proprieties";
import * as path from 'node:path';

export type bedrockParseProprieties = {
  "server-name": string,
  gamemode: "survival"|"creative"|"adventure",
  "force-gamemode": boolean,
  difficulty: "peaceful"|"easy"|"normal"|"hard",
  "allow-cheats": boolean,
  "max-players": number,
  "online-mode": boolean,
  "allow-list": boolean,
  "server-port": number,
  "server-portv6": number,
  "view-distance": number,
  "tick-distance": 4|6|8|10|12,
  "player-idle-timeout": number,
  "max-threads": number,
  "level-name": string,
  "level-seed": string|number|bigint|null,
  "default-player-permission-level": "visitor"|"member"|"operator",
  "texturepack-required": boolean,
  "content-log-file-enabled": boolean,
  "compression-threshold": number,
  "server-authoritative-movement": "client-auth"|"server-auth"|"server-auth-with-rewind",
  "player-movement-score-threshold": number,
  "player-movement-action-direction-threshold": number,
  "player-movement-distance-threshold": number,
  "player-movement-duration-threshold-in-ms": number,
  "correct-player-movement": boolean,
  "server-authoritative-block-breaking": boolean,
  "chat-restriction": "None"|"Dropped"|"Disabled",
  "disable-player-interaction": boolean
};

export async function getConfig(): Promise<bedrockParseProprieties> {
  return Proprieties.parse(await readFile(path.join(serverPath, "server.proprieties"), "utf8")) as bedrockParseProprieties;
}

const keys = RegExp("("+(["server-name", "gamemode", "force-gamemode", "difficulty", "allow-cheats", "max-players", "online-mode", "allow-list", "server-port", "server-portv6", "view-distance", "tick-distance", "player-idle-timeout", "max-threads", "level-name", "level-seed", "default-player-permission-level", "texturepack-required", "content-log-file-enabled", "compression-threshold", "server-authoritative-movement", "player-movement-score-threshold", "player-movement-action-direction-threshold", "player-movement-distance-threshold", "player-movement-duration-threshold-in-ms", "correct-player-movement", "server-authoritative-block-breaking", "chat-restriction", "disable-player-interaction"]).join("|")+")")

export function createConfig(config: bedrockParseProprieties): string {
  let configString = "";
  for (const key of Object.keys(config).filter(a => keys.test(a))) configString += `${key}=${config[key]}\n`;
  return configString.trim();
}

/*
console.log(createConfig({
  "server-name": "string",
  gamemode: "survival",
  "force-gamemode": true,
  difficulty: "easy",
  "allow-cheats": false,
  "max-players": 20,
  "online-mode": false,
  "allow-list": true,
  "server-port": 19135,
  "server-portv6": 19136,
  "view-distance": 32,
  "tick-distance": 8,
  "player-idle-timeout": 0,
  "max-threads": 16,
  "level-name": "string",
  "level-seed": null,
  "default-player-permission-level": "member",
  "texturepack-required": true,
  "content-log-file-enabled": false,
  "compression-threshold": 0,
  "server-authoritative-movement": "server-auth-with-rewind",
  "player-movement-score-threshold": 0.9,
  "player-movement-action-direction-threshold": 0.6,
  "player-movement-distance-threshold": 0.6,
  "player-movement-duration-threshold-in-ms": 0.6,
  "correct-player-movement": false,
  "server-authoritative-block-breaking": false,
  "chat-restriction": "Disabled",
  "disable-player-interaction": false
}));
*/