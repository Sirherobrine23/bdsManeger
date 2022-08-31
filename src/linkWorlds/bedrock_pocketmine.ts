import * as path from "node:path";
import * as fs from "node:fs/promises";
import { existsSync as fsExistsSync } from "node:fs";
import { worldFolder } from "../pathControl";
import { serverPath as bedrockServerPath } from "../bedrock";
import { serverPath as pocketmineServerPath } from "../pocketmine";

export const bedrockWorld = path.join(worldFolder, "bedrock");
export const bedrockServerWorld = path.join(bedrockServerPath, "worlds");
export async function linkBedrock() {
  if (!fsExistsSync(bedrockWorld)) await fs.mkdir(bedrockWorld, {recursive: true});
  if (fsExistsSync(bedrockServerWorld)) {
    if (await fs.realpath(bedrockWorld) === bedrockServerWorld) return;
    for (const folder of await fs.readdir(bedrockServerWorld)) await fs.cp(path.join(bedrockServerWorld, folder), path.join(bedrockWorld, folder), {recursive: true, force: true, preserveTimestamps: true, verbatimSymlinks: true});
    if (!fsExistsSync(bedrockServerWorld+"_backup")) await fs.rename(bedrockServerWorld, bedrockServerWorld+"_backup");
  }
  await fs.symlink(bedrockWorld, bedrockServerWorld);
  return;
}

export const pocketmineWorld = path.join(worldFolder, "pocketmine");
export const pocketmineServerWorld = path.join(pocketmineServerPath, "worlds");
export async function linkPocketmine() {
  if (!fsExistsSync(pocketmineWorld)) await fs.mkdir(pocketmineWorld, {recursive: true});
  if (fsExistsSync(pocketmineServerWorld)) {
    if (await fs.realpath(pocketmineWorld) === pocketmineServerWorld) return;
    for (const folder of await fs.readdir(pocketmineServerWorld)) await fs.cp(path.join(pocketmineServerWorld, folder), path.join(pocketmineWorld, folder), {recursive: true, force: true, preserveTimestamps: true, verbatimSymlinks: true});
    if (!fsExistsSync(pocketmineServerWorld+"_backup")) await fs.rename(pocketmineServerWorld, pocketmineServerWorld+"_backup");
  }
  await fs.symlink(pocketmineWorld, pocketmineServerWorld);
  return;
}