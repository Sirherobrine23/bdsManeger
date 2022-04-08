import path from "path";
import fs from "fs";
import os from "os";
import * as bdsTypes from "./globalType";

export const storage = path.resolve(process.env.WORLD_STORAGE||path.join(os.homedir(), "bds_core/worlds"));
if (!fs.existsSync(storage)) fs.mkdirSync(storage);

export async function storageWorld(Platform: bdsTypes.Platform, serverPath: string, world?: string) {
  if (Platform === "bedrock") {
    const onStorageBedrock = path.join(storage, "bedrock");
    if (!fs.existsSync(onStorageBedrock)) fs.mkdirSync(onStorageBedrock);
    const bedrockServerWorld = path.join(serverPath, "worlds");
    if (!fs.existsSync(bedrockServerWorld)) fs.mkdirSync(bedrockServerWorld);
    else {
      if (!fs.statSync(bedrockServerWorld).isSymbolicLink()) {
        for (const folder of fs.readdirSync(bedrockServerWorld)) {
          await fs.promises.rename(path.join(bedrockServerWorld, folder), path.join(onStorageBedrock, folder))
        }
        await fs.promises.rmdir(bedrockServerWorld);
      } else return
    }
    fs.symlinkSync(bedrockServerWorld, path.join(onStorageBedrock), "dir");
    return;
  } else if (Platform === "java") {
    if (!world) throw new Error("No world name provided");
    const onStorageJava = path.join(storage, "java");
    if (!fs.existsSync(onStorageJava)) fs.mkdirSync(onStorageJava);
    const javaServerWorld = path.join(serverPath, world);
    if (!fs.existsSync(javaServerWorld)) fs.mkdirSync(javaServerWorld);
    else {
      if (!fs.statSync(javaServerWorld).isSymbolicLink()) {
        await fs.promises.rename(javaServerWorld, path.join(onStorageJava, world));
      } else return
    }
    fs.symlinkSync(javaServerWorld, path.join(onStorageJava, world), "dir");
    return;
  }
  throw new Error("Platform not supported");
}
