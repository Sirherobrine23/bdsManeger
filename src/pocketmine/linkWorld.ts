import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import * as path from "path";
import { serverRoot, worldStorageRoot } from "../pathControl";

export async function linkWorld(): Promise<void> {
  const worldFolder = path.join(worldStorageRoot, "pocketmine");
  const pocketmineFolder = path.join(serverRoot, "pocketmine");
  if (!fsOld.existsSync(pocketmineFolder)) throw new Error("Server not installed")
  if (!fsOld.existsSync(worldFolder)) await fs.mkdir(worldFolder, {recursive: true});
  const pocketmineServerWorld = path.join(pocketmineFolder, "worlds");
  if (fsOld.existsSync(pocketmineServerWorld)) {
    if ((await fs.lstat(pocketmineServerWorld)).isSymbolicLink()) return;
    for (const folder of await fs.readdir(pocketmineServerWorld)) {
      await fs.rename(path.join(pocketmineServerWorld, folder), path.join(worldFolder, folder))
    }
    await fs.rmdir(pocketmineServerWorld);
  }
  await fs.symlink(worldFolder, pocketmineServerWorld, "dir");
  return;
}