import path from "path";
import os from "os";
import fs from "fs";
import * as prismarineNbt from "prismarine-nbt";
import properties_to_json from "properties-to-json";
import * as bdsType from "./globalType";

type BdsConfigGet = {
  world: string;
  description: string;
  gamemode: string;
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
  const serverPath = path.resolve(process.env.SERVERPATH||path.join(os.homedir(), "bds_core/servers"), Platform);
  if (Platform === "bedrock") {
    const bedrockConfigPath = path.join(serverPath, "server.properties");
    if (!(fs.existsSync(bedrockConfigPath))) throw new Error("Bedrock server config not found");
    const bedrockConfig = properties_to_json(fs.readFileSync(bedrockConfigPath, "utf8"));
    const bedrockConfigNbtPath = path.join(serverPath, "worlds", bedrockConfig["level-name"], "level.dat");
    return {
      world: bedrockConfig["level-name"],
      description: bedrockConfig["server-name"],
      difficulty: bedrockConfig["difficulty"],
      gamemode: bedrockConfig["gamemode"],
      players: parseInt(bedrockConfig["max-players"]),
      whitelist: bedrockConfig["white-list"] === "true",
      portv4: parseInt(bedrockConfig["server-port"]),
      portv6: parseInt(bedrockConfig["server-portv6"]),
      nbt: (fs.existsSync(bedrockConfigNbtPath)) ? await prismarineNbt.parse(fs.readFileSync(bedrockConfigNbtPath)) : undefined
    };
  }
  throw new Error("Platform not supported");
}