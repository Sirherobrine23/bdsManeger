import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import * as path from "path";
import { serverRoot, worldStorageRoot } from "../pathControl";

export async function linkWorld(): Promise<void> {
  const worldFolder = path.join(worldStorageRoot, "bedrock");
  const bedrockFolder = path.join(serverRoot, "bedrock");
  if (!fsOld.existsSync(bedrockFolder)) throw new Error("Server not installed")
  if (!fsOld.existsSync(worldFolder)) await fs.mkdir(worldFolder, {recursive: true});
  const bedrockServerWorld = path.join(bedrockFolder, "worlds");
  if (fsOld.existsSync(bedrockServerWorld)) {
    if ((await fs.lstat(bedrockServerWorld)).isSymbolicLink()) return;
    for (const folder of await fs.readdir(bedrockServerWorld)) {
      await fs.rename(path.join(bedrockServerWorld, folder), path.join(worldFolder, folder))
    }
    await fs.rmdir(bedrockServerWorld);
  }
  await fs.symlink(worldFolder, bedrockServerWorld, "dir");
  return;
}