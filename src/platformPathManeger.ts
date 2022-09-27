import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

export let bdsRoot = path.join(os.homedir(), ".bdsManeger");
if (process.env.BDS_HOME) {
  if (process.env.BDS_HOME.startsWith("~")) process.env.BDS_HOME = process.env.BDS_HOME.replace("~", os.homedir());
  bdsRoot = process.env.BDS_HOME;
}
async function exists(filePath: string) {
  return fs.access(filePath).then(() => true).catch((() => false));
}

export type bdsPlatform = "bedrock"|"java"|"pocketmine"|"spigot"|"powernukkit"|"paper";
export type bdsPlatformOptions = {
  newId?: boolean,
  id?: "default"|string,
  withBuildFolder?: boolean
};

// This array to valida platform imput!
const platformArray: bdsPlatform[] = [
  "bedrock",
  "java",
  "pocketmine",
  "spigot",
  "powernukkit",
  "paper"
];

/**
 * Register or get folder to Servers, this is to create and maneger folders
 * @param platform - Select platform to maneger folders
 * @param options - ?
 */
export async function pathControl(platform: bdsPlatform, options?: bdsPlatformOptions) {
  if (!platformArray.includes(platform)) throw new Error("Invalid platform");
  if (!options) options = {};
  if (!await exists(path.join(bdsRoot, platform))) await fs.mkdir(path.join(bdsRoot, platform), {recursive: true});

  // Create if not exists
  const foldersAndLink = await fs.readdir(path.join(bdsRoot, platform));
  if (foldersAndLink.length === 0) options.newId = true;
  if (options.newId) {
    options.id = crypto.randomBytes(12).toString("hex");
    fs.mkdir(path.join(bdsRoot, platform, options.id), {recursive: true});
    if (await exists(path.join(bdsRoot, platform, "default"))) await fs.unlink(path.join(bdsRoot, platform, "default"));
    await fs.symlink(path.join(bdsRoot, platform, options.id), path.join(bdsRoot, platform, "default"));
  }

  // Get real id
  if (options?.id === "default") options.id = path.basename(await fs.realpath(path.join(bdsRoot, platform, options.id)));

  // Create folder if not exists
  const serverRoot = path.join(bdsRoot, platform, options.id);
  if (!(await exists(serverRoot))) await fs.mkdir(serverRoot, {recursive: true});
  const serverPath = path.join(serverRoot, "server");

  if (!(await exists(serverPath))) await fs.mkdir(serverPath, {recursive: true});
  const hooksPath = path.join(serverRoot, "hooks");

  if (!(await exists(hooksPath))) await fs.mkdir(hooksPath, {recursive: true});
  const backupPath = path.join(serverRoot, "backup");

  if (!(await exists(backupPath))) await fs.mkdir(backupPath, {recursive: true});
  const logsPath = path.join(serverRoot, "logs");

  if (!(await exists(logsPath))) await fs.mkdir(logsPath, {recursive: true});
  let buildFolder: string;

  if (options?.withBuildFolder) {
    buildFolder = path.join(serverRoot, "build");
    if (!(await exists(buildFolder))) await fs.mkdir(buildFolder, {recursive: true});
  }

  return {
    id: options?.id,
    serverRoot,
    serverPath,
    hooksPath,
    backupPath,
    logsPath,
    buildFolder,
  };
}

/**
 * Change default folder to Platform
 * @param platform
 * @param id
 * @returns
 */
export async function changeDefault(platform: bdsPlatform, id: bdsPlatformOptions["id"]) {
  if (!platformArray.includes(platform)) throw new Error("Invalid platform");
  const serverPlatform = path.join(bdsRoot, platform);
  if (!await exists(serverPlatform)) throw new Error("Install server fist!");
  const ids = (await fs.readdir(serverPlatform)).filter(folder => folder.toLowerCase() !== "default");
  if (!ids.includes(id)) throw new Error("Id not exists to Platform");
  const oldPath = fs.realpath(path.join(bdsRoot, platform, "default"));
  if (await exists(path.join(bdsRoot, platform, "default"))) await fs.unlink(path.join(bdsRoot, platform, "default"));
  await fs.symlink(path.join(bdsRoot, platform, id), path.join(bdsRoot, platform, "default"));

  return {
    oldPath,
    newPath: path.join(bdsRoot, platform, id)
  };
}