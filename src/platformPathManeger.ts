import { extendFs } from "@the-bds-maneger/core-utils";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
export let bdsRoot = process.env.BDS_HOME?(process.env.BDS_HOME.startsWith("~")?process.env.BDS_HOME.replace("~", os.homedir()):process.env.BDS_HOME):path.join(os.homedir(), ".bdsManeger");

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
  if (!await extendFs.exists(platformRoot)) await fs.mkdir(platformRoot, {recursive: true});
  if (!options) options = {};

  // Create if not exists
  const foldersAndLink = await fs.readdir(platformRoot);
  if (foldersAndLink.length === 0) options.newId = true;
  if (options.newId) {
    options.id = crypto.randomBytes(16).toString("hex");
    fs.mkdir(path.join(platformRoot, options.id), {recursive: true});
    if (await extendFs.exists(path.join(platformRoot, "default"))) await fs.unlink(path.join(platformRoot, "default"));
    await fs.symlink(path.join(platformRoot, options.id), path.join(platformRoot, "default"));
  } else if (!await extendFs.exists(path.join(platformRoot, options.id))) throw new Error("Folder ID not created!");

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
  if (!(await extendFs.exists(serverRoot))) await fs.mkdir(serverRoot, {recursive: true});
  if (!(await extendFs.exists(serverPath))) await fs.mkdir(serverPath, {recursive: true});
  if (!(await extendFs.exists(hooksPath))) await fs.mkdir(hooksPath, {recursive: true});
  if (!(await extendFs.exists(backupPath))) await fs.mkdir(backupPath, {recursive: true});
  if (!(await extendFs.exists(logsPath))) await fs.mkdir(logsPath, {recursive: true});
  if (buildFolder && !(await extendFs.exists(buildFolder))) await fs.mkdir(buildFolder, {recursive: true});

  return {
    id: options?.id,
    serverRoot,
    serverPath,
    hooksPath,
    backupPath,
    logsPath,
    buildFolder,
    platformIDs: foldersAndLink
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
  if (!await extendFs.exists(serverPlatform)) throw new Error("Install server fist!");
  const ids = (await fs.readdir(serverPlatform)).filter(folder => folder.toLowerCase() !== "default");
  if (!ids.includes(id)) throw new Error("Id not exists to Platform");
  const oldPath = fs.realpath(path.join(bdsRoot, platform, "default"));
  if (await extendFs.exists(path.join(bdsRoot, platform, "default"))) await fs.unlink(path.join(bdsRoot, platform, "default"));
  await fs.symlink(path.join(bdsRoot, platform, id), path.join(bdsRoot, platform, "default"));

  return {
    oldPath,
    newPath: path.join(bdsRoot, platform, id)
  };
}

export type platformIds = {
  [platform in bdsPlatform]?: {
    realID?: string,
    id: string,
  }[]
};

/**
 * Get all ids to all platforms installed
 * @returns
 */
export async function getIds(): Promise<platformIds>;
/**
 * Get all ids to platform
 * @param platform - Set platform to get ids
 * @returns
 */
export async function getIds(platform: bdsPlatform): Promise<string[]>;
export async function getIds(platform?: bdsPlatform): Promise<platformIds|string[]> {
  if (!platform) {
    const platformIds: platformIds = {};
    if (!await extendFs.exists(bdsRoot)) return platformIds;
    const Platforms = (await fs.readdir(bdsRoot)).filter(folder => platformArray.includes(folder as bdsPlatform));
    await Promise.all(Platforms.map(async Platform => {
      for (const id of await fs.readdir(path.join(bdsRoot, Platform))) {
        if (!platformIds[Platform]) platformIds[Platform] = []
        const idPlatform = path.join(bdsRoot, Platform, id);
        const realPath = await fs.realpath(idPlatform);
        if (idPlatform !== realPath) platformIds[Platform].push({id, realID: path.basename(realPath)});
        else platformIds[Platform].push({id});
      }
    }));
    return platformIds;
  }
  if (!platformArray.includes(platform)) throw new Error("Invalid platform");
  const serverPlatform = path.join(bdsRoot, platform);
  if (!await extendFs.exists(serverPlatform)) throw new Error("Install server fist!");
  return (await fs.readdir(serverPlatform)).filter(folder => folder.toLowerCase() !== "default");
}