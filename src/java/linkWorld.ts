import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import * as path from "path";
import { serverRoot, worldStorageRoot } from "../pathControl";
const filesFoldertoIgnore = ["Server.jar", "eula.txt", "libraries", "logs", "usercache.json", "versions", "banned-ips.json", "banned-players.json", "ops.json", "server.properties", "whitelist.json"];

export async function linkWorld(): Promise<void> {
  const worldFolder = path.join(worldStorageRoot, "java");
  const javaFolder = path.join(serverRoot, "java");
  if (!fsOld.existsSync(javaFolder)) throw new Error("Server not installed")
  if (!fsOld.existsSync(worldFolder)) await fs.mkdir(worldFolder, {recursive: true});
  // From Worlds Folders
  for (const worldPath of await fs.readdir(worldFolder)) {
    const serverWorld = path.join(javaFolder, worldPath);
    const worldStorage = path.join(worldFolder, worldPath);
    if (fsOld.existsSync(serverWorld)) {
      if ((await fs.lstat(serverWorld)).isSymbolicLink()) continue;
    }
    try {
      await fs.cp(worldStorage, serverWorld, {recursive: true});
      await fs.rm(worldStorage, {recursive: true});
      await fs.symlink(worldStorage, serverWorld);
    } catch (err) {
      console.log(err);
      continue
    }
  }
  // From Server folder
  for (const worldPath of (await fs.readdir(javaFolder)).filter(x => !filesFoldertoIgnore.includes(x))) {
    const serverWorld = path.join(worldFolder, worldPath);
    const worldStorage = path.join(javaFolder, worldPath);
    if ((await fs.lstat(worldStorage)).isSymbolicLink()) continue;
    try {
      await fs.cp(worldStorage, serverWorld, {recursive: true});
      await fs.rm(worldStorage, {recursive: true});
      await fs.symlink(serverWorld, worldStorage);
    } catch (err) {
      console.log(err);
      continue
    }
  }
  return;
}