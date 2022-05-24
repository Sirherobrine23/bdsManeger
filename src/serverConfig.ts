import crypto from "crypto";
import path from "node:path";
import fs from "node:fs";
import * as prismarineNbt from "prismarine-nbt";
import properties_to_json from "./lib/Proprieties";
import * as bdsType from "./globalType";
import { serverRoot } from "./pathControl";

export type BdsConfigGet = {
  world: string;
  description: string;
  gamemode: "survival"|"creative"|"adventure"|"spectator";
  difficulty: "peaceful"|"easy"|"normal"|"hard";
  players: number;
  whitelist: true|false;
  portv4: number;
  portv6: number;
  nbt?: {
    parsed: prismarineNbt.NBT;
    type: prismarineNbt.NBTFormat;
    metadata: prismarineNbt.Metadata;
  }|undefined;
}

export async function parseConfig(Platform: bdsType.Platform): Promise<BdsConfigGet> {
  const serverPath = path.join(serverRoot, Platform);
  if (Platform === "bedrock") {
    const bedrockConfigPath = path.join(serverPath, "server.properties");
    if (!(fs.existsSync(bedrockConfigPath))) throw new Error("Bedrock server config not found");
    const bedrockConfig = properties_to_json(fs.readFileSync(bedrockConfigPath, "utf8"));
    const bedrockConfigNbtPath = path.join(serverPath, "worlds", String(bedrockConfig["level-name"]), "level.dat");
    return {
      world: String(bedrockConfig["level-name"]),
      description: String(bedrockConfig["server-name"]),
      difficulty: String(bedrockConfig["difficulty"]) as "peaceful"|"easy"|"normal"|"hard",
      gamemode: String(bedrockConfig["gamemode"]) as "survival"|"creative"|"adventure"|"spectator",
      players: parseInt(String(bedrockConfig["max-players"])),
      whitelist: bedrockConfig["white-list"] === "true",
      portv4: parseInt(String(bedrockConfig["server-port"])),
      portv6: parseInt(String(bedrockConfig["server-portv6"])),
      nbt: (fs.existsSync(bedrockConfigNbtPath)) ? await prismarineNbt.parse(fs.readFileSync(bedrockConfigNbtPath)) : undefined
    };
  }
  throw new Error("Platform not supported");
}

export type BdsConfigSet = {
  world: string;
  description: string;
  gamemode: "survival"|"creative"|"adventure"|"hardcore";
  difficulty: "peaceful"|"easy"|"normal"|"hard";
  seed?: string;
  players?: number;
  whitelist?: true|false;
  require_login?: true|false;
  cheats_command?: true|false;
  portv4?: number;
  portv6?: number;
}

export async function createConfig(Platform: bdsType.Platform, config: BdsConfigSet): Promise<void> {
  const serverPath = path.join(serverRoot, Platform);
  if (Platform === "bedrock") {
    if (!(config.seed && typeof config.seed === "string")) config.seed = "";
    if (!(config.players && typeof config.players === "number")) config.players = 20;
    if (!(config.whitelist && typeof config.whitelist === "boolean")) config.whitelist = false;
    if (!(config.require_login && typeof config.require_login === "boolean")) config.require_login = false;
    if (!(config.cheats_command && typeof config.cheats_command === "boolean")) config.cheats_command = false;
    if (!(config.portv4 && typeof config.portv4 === "number")) config.portv4 = 19132;
    if (!(config.portv6 && typeof config.portv6 === "number")) config.portv6 = 19133;
    const bedrockConfigArray = [
      "view-distance=32",
      "tick-distance=4",
      "player-idle-timeout=0",
      "max-threads=8",
      "default-player-permission-level=member",
      "texturepack-required=true",
      "content-log-file-enabled=false",
      "compression-threshold=1",
      "server-authoritative-movement=server-auth",
      "player-movement-score-threshold=20",
      "player-movement-action-direction-threshold=0.85",
      "player-movement-distance-threshold=0.3",
      "player-movement-duration-threshold-in-ms=500",
      "correct-player-movement=false",
      "server-authoritative-block-breaking=false",
      "force-gamemode=false",
    ];
    bedrockConfigArray.push(`level-name=${config.world}`);
    if (config.seed) bedrockConfigArray.push(`level-seed=${config.seed}`);
    else bedrockConfigArray.push("level-seed=");
    bedrockConfigArray.push(`server-name=${config.description}`);
    bedrockConfigArray.push(`gamemode=${config.gamemode}`);
    bedrockConfigArray.push(`difficulty=${config.difficulty}`);
    bedrockConfigArray.push(`allow-cheats=${config.cheats_command}`);
    bedrockConfigArray.push(`max-players=${config.players}`);
    bedrockConfigArray.push(`online-mode=${config.require_login}`);
    bedrockConfigArray.push(`allow-list=${config.whitelist}`);
    bedrockConfigArray.push(`server-port=${config.portv4}`);
    bedrockConfigArray.push(`server-portv6=${config.portv6}`);
    const bedrockConfig = bedrockConfigArray.join("\n");
    fs.writeFileSync(path.join(serverPath, "server.properties"), bedrockConfig);
    return;
  } else if (Platform === "java") {
    if (!(config.seed && typeof config.seed === "string")) config.seed = "";
    if (!(config.players && typeof config.players === "number")) config.players = 20;
    if (!(config.whitelist && typeof config.whitelist === "boolean")) config.whitelist = false;
    if (!(config.require_login && typeof config.require_login === "boolean")) config.require_login = false;
    if (!(config.cheats_command && typeof config.cheats_command === "boolean")) config.cheats_command = false;
    if (!(config.portv4 && typeof config.portv4 === "number")) config.portv4 = 25565;
    if (!(config.portv6 && typeof config.portv6 === "number")) config.portv6 = 255656;
    const javaConfigArray = [
      "query.port=65551",
      "enable-jmx-monitoring=false",
      "enable-query=true",
      "generator-settings=",
      "generate-structures=true",
      "network-compression-threshold=256",
      "max-tick-time=60000",
      "use-native-transport=true",
      "enable-status=true",
      "allow-flight=false",
      "view-distance=32",
      "max-build-height=256",
      "server-ip=",
      "sync-chunk-writes=true",
      "prevent-proxy-connections=false",
      "resource-pack=",
      "entity-broadcast-range-percentage=100",
      "player-idle-timeout=0",
      "force-gamemode=false",
      "rate-limit=0",
      "broadcast-console-to-ops=true",
      "spawn-npcs=true",
      "spawn-animals=true",
      "snooper-enabled=true",
      "function-permission-level=2",
      "text-filtering-config=",
      "spawn-monsters=true",
      "enforce-whitelist=false",
      "resource-pack-sha1=",
      "spawn-protection=16",
      "max-world-size=29999984",
      "require-resource-pack=true",
      "resource-pack-prompt=",
      "hide-online-players=false",
      "simulation-distance=10",
      "enable-rcon=false",
      `rcon.password=${crypto.randomBytes(6).toString("hex")}`,
      "rcon.port=25575",
      "broadcast-rcon-to-ops=true"
    ];
    javaConfigArray.push(`level-name=${config.world}`);
    javaConfigArray.push(`motd=${config.description}`);
    if (config.gamemode === "hardcore") {
      javaConfigArray.push("gamemode=survival");
      javaConfigArray.push("hardcore=true");
    } else {
      javaConfigArray.push(`gamemode=${config.gamemode}`);
      javaConfigArray.push(`hardcore=false`);
    }
    javaConfigArray.push(`difficulty=${config.difficulty}`);
    if (config.seed) javaConfigArray.push(`level-seed=${config.seed}`);
    else javaConfigArray.push("level-seed=");
    javaConfigArray.push(`enable-command-block=${config.cheats_command}`);
    javaConfigArray.push(`max-players=${config.players}`);
    javaConfigArray.push(`online-mode=${config.require_login}`);
    javaConfigArray.push(`white-list=${config.whitelist}`);
    javaConfigArray.push(`server-port=${config.portv4}`);
    javaConfigArray.push("level-type=default");
    javaConfigArray.push("op-permission-level=4");
    javaConfigArray.push("pvp=true");
    javaConfigArray.push("allow-nether=true");
    await fs.promises.writeFile(path.join(serverPath, "server.properties"), javaConfigArray.join("\n"));
  } else if (Platform === "pocketmine") {}
  throw new Error("Platform not supported");
}