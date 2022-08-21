import * as fs from "node:fs/promises";
import * as path from "node:path";
import Git from "./git";
import { worldStorageRoot, serverRoot } from "./pathControl";
import type { Platform } from "./globalType";
export const worldGit = new Git(worldStorageRoot, {remoteUrl: process.env.BDS_GIT_WORLDBACKUP});

setInterval(async () => {
  if ((await worldGit.status()).length === 0) return;
  console.log("Committing world backup");
  await worldGit.addSync(".");
  await worldGit.commitSync("Automatic backup");
  await worldGit.pushSync().catch(err => console.error(err));
  return;
}, 1000*60*60*2);

export async function copyWorld(serverPlatform: Platform, worldName: string, worldPath: string) {
  const copyPath = path.join(serverRoot, serverPlatform, worldPath);
  const worldPathFolder = path.join(worldGit.repoRoot, serverPlatform);
  if (await fs.lstat(worldPathFolder).then(stats => stats.isDirectory()).catch(() => false)) await fs.mkdir(path.join(worldGit.repoRoot, serverPlatform));
  if (await fs.lstat(path.join(worldPathFolder, worldName)).then(stats => stats.isDirectory() && !stats.isSymbolicLink()).catch(() => false)) {
    await fs.rmdir(path.join(worldPathFolder, worldName), {recursive: true});
    await fs.cp(copyPath, path.join(worldPathFolder, worldName), {recursive: true, force: true});
  }
  await worldGit.addSync(path.join(worldPathFolder, worldName));
  const currentDate = new Date();
  await worldGit.commitSync(`${worldName} backup - ${currentDate.getDate()}.${currentDate.getMonth()}.${currentDate.getFullYear()}`, [`${worldName} backup - ${currentDate.toLocaleDateString()}`]);
  await worldGit.pushSync().catch(err => console.error(err));
}

export async function restoreWorld(serverPlatform: Platform, worldName: string, worldPath: string) {
  // check if world exists in repo
  const worldPathFolder = path.join(worldGit.repoRoot, serverPlatform);
  if (!await fs.lstat(path.join(worldPathFolder, worldName)).then(stats => stats.isDirectory() && !stats.isSymbolicLink()).catch(() => false)) throw new Error("World folder does not exist");
  // check if world is not link to worlds
  if (await fs.lstat(path.join(worldPathFolder, worldName)).then(stats => stats.isSymbolicLink()).catch(() => false)) throw new Error("World folder is a link, do not necessary restore");
  // rename world folder
  if (await fs.lstat(worldPath+"_backup").then(stats => stats.isDirectory()).catch(() => false)) await fs.rmdir(worldPath, {recursive: true});
  await fs.rename(worldPath, worldPath+"_backup");
  // copy world to world path
  await fs.cp(path.join(worldPathFolder, worldName), worldPath, {recursive: true, force: true});
}