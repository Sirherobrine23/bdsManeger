import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

/** Same fs.exsistSync */
async function exists(filePath: string) {
  return fs.access(filePath).then(() => true).catch((() => false));
}

export let bdsRoot = path.join(os.homedir(), ".bdsManeger");
if (process.env.BDS_HOME) {
  if (process.env.BDS_HOME.startsWith("~")) process.env.BDS_HOME = process.env.BDS_HOME.replace("~", os.homedir());
  bdsRoot = process.env.BDS_HOME;
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

// Test ID
const idRegex = /^[A-Za-z0-9]*$/;

/**
 * Register or get folder to Servers, this is to create and maneger folders
 * @param platform - Select platform to maneger folders
 * @param options - ?
 */
export async function pathControl(platform: bdsPlatform, options?: bdsPlatformOptions) {
  if (!platformArray.includes(platform)) throw new Error("Invalid platform");
  const platformRoot = path.join(bdsRoot, platform);
  if (!await exists(platformRoot)) await fs.mkdir(platformRoot, {recursive: true});
  if (!options) options = {};

  // Create if not exists
  const foldersAndLink = await fs.readdir(platformRoot);
  if (foldersAndLink.length === 0) options.newId = true;
  if (options.newId) {
    options.id = crypto.randomBytes(16).toString("hex");
    fs.mkdir(path.join(platformRoot, options.id), {recursive: true});
    if (await exists(path.join(platformRoot, "default"))) await fs.unlink(path.join(platformRoot, "default"));
    await fs.symlink(path.join(platformRoot, options.id), path.join(platformRoot, "default"));
  } else if (!await exists(path.join(platformRoot, options.id))) throw new Error("Folder ID not created!");

  // Get real id
  if (!idRegex.test(options.id)) throw new Error("Invalid Platform ID");
  if (options?.id === "default") options.id = path.basename(await fs.realpath(path.join(platformRoot, options.id)));

  // Mount Paths
  const serverRoot = path.join(platformRoot, options.id);
  const serverPath = path.join(serverRoot, "server");
  const hooksPath = path.join(serverRoot, "hooks");
  const backupPath = path.join(serverRoot, "backup");
  const logsPath = path.join(serverRoot, "logs");
  let buildFolder: string;
  if (options?.withBuildFolder) buildFolder = path.join(serverRoot, "build");

  // Create folder if not exists
  if (!(await exists(serverRoot))) await fs.mkdir(serverRoot, {recursive: true});
  if (!(await exists(serverPath))) await fs.mkdir(serverPath, {recursive: true});
  if (!(await exists(hooksPath))) await fs.mkdir(hooksPath, {recursive: true});
  if (!(await exists(backupPath))) await fs.mkdir(backupPath, {recursive: true});
  if (!(await exists(logsPath))) await fs.mkdir(logsPath, {recursive: true});
  if (buildFolder && !(await exists(buildFolder))) await fs.mkdir(buildFolder, {recursive: true});

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

/**
 * Get all ids to platform
 * @param platform
 * @returns
 */
export async function getIds(platform: bdsPlatform) {
  if (!platformArray.includes(platform)) throw new Error("Invalid platform");
  const serverPlatform = path.join(bdsRoot, platform);
  if (!await exists(serverPlatform)) throw new Error("Install server fist!");
  return (await fs.readdir(serverPlatform)).filter(folder => folder.toLowerCase() !== "default");
}