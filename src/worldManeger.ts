import path from "path";
import fs from "fs";
import os from "os";
import * as bdsTypes from "./globalType";

const storage = path.resolve(process.env.WORLD_STORAGE||path.join(os.homedir(), "bds_core/servers"));
export async function storageWorld(Platform: bdsTypes.Platform, world: string, serverPath: string) {
  if (Platform === "bedrock") {
     const bedrockServerWorld = path.join(serverPath, "worlds", world);
     const onStorageBedrock = path.join(storage, "bedrock");
     if (!fs.existsSync(bedrockServerWorld)) fs.mkdirSync(bedrockServerWorld);
     fs.symlinkSync(bedrockServerWorld, path.join(onStorageBedrock, world), "dir");
     return bedrockServerWorld;
  }
  throw new Error("Platform not supported");
}
