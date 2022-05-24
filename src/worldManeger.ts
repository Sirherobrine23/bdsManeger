import path from "node:path";
import fs, {promises as fsPromise} from "node:fs";
import * as bdsTypes from "./globalType";
import { worldStorageRoot } from "./pathControl";

export const storage = worldStorageRoot;
export async function storageWorld(Platform: bdsTypes.Platform, serverPath: string, world?: string) {
  if (process.platform === "win32") throw new Error("Windows is not supported");
  if (!fs.existsSync(storage)) await fsPromise.mkdir(storage, {recursive: true});
  // On storage path
  const onStorage = path.join(storage, Platform);
  if (!fs.existsSync(onStorage)) fs.mkdirSync(onStorage);

  // Prepare to platforms
  if (Platform === "bedrock") {
    // Bedrock Path
    const bedrockServerWorld = path.join(serverPath, "worlds");
    if (fs.existsSync(bedrockServerWorld)) {
      if (fs.lstatSync(bedrockServerWorld).isSymbolicLink()) return;
      for (const folder of fs.readdirSync(bedrockServerWorld)) {
        await fs.promises.rename(path.join(bedrockServerWorld, folder), path.join(onStorage, folder))
      }
      await fs.promises.rmdir(bedrockServerWorld);
    }
    await fs.promises.symlink(onStorage, bedrockServerWorld, "dir");
    return;
  } else if (Platform === "pocketmine") {
    // pocketmine Path
    const pocketmineWorld = path.join(serverPath, "worlds");
    if (fs.existsSync(pocketmineWorld)) {
      if (fs.lstatSync(pocketmineWorld).isSymbolicLink()) return;
      for (const folder of fs.readdirSync(pocketmineWorld)) {
        await fs.promises.rename(path.join(pocketmineWorld, folder), path.join(onStorage, folder))
      }
      await fs.promises.rmdir(pocketmineWorld);
    }
    await fs.promises.symlink(onStorage, pocketmineWorld, "dir");
    return;
  } else if (Platform === "java") {
    if (!world) throw new Error("No world name provided");
    // Java Path to map
    const javaServerWorld = path.join(serverPath, world);
    if (fs.existsSync(javaServerWorld)) {
      if (fs.lstatSync(javaServerWorld).isSymbolicLink()) return;
      await fs.promises.rename(javaServerWorld, path.join(onStorage, world));
    }
    await fs.promises.symlink(path.join(onStorage, world), javaServerWorld, "dir");
  }
  throw new Error("Platform not supported");
}