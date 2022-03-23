import path from "path";
import fs from "fs";
import os from "os";
import adm_zip from "adm-zip";
import { getBuffer, getGithubRelease } from "./HttpRequests";
import * as bdsTypes from "./globalType";

type getVersionsType = {
  latest: {
    [d: string]: string|undefined
  };
  platform: Array<{
    name: bdsTypes.Platform;
    version: string;
    Date: string;
    data: string | {[platform: string]: {[arch: string]: string;};};
  }>;
};

export async function getVersions(): Promise<getVersionsType> {
  return JSON.parse((await getBuffer("https://raw.githubusercontent.com/The-Bds-Maneger/ServerVersions/main/src/Versions.json")).toString("utf8"));
}

async function InstallPHP(PathToInstall: string) {
  const Release = (await getGithubRelease("The-Bds-Maneger", "PocketMinePHPAutoBinBuilds"))[0].assets.find(asset => RegExp(process.platform).test(asset.name) && RegExp(os.arch()).test(asset.name));
  if (!Release) throw new Error("No file found for this Platform and Arch");
  const PHPZip = new adm_zip(await getBuffer(Release.browser_download_url));
  if (fs.existsSync(path.resolve(PathToInstall, "bin"))) await fs.promises.rmdir(path.resolve(PathToInstall, "bin"), {recursive: true});
  PHPZip.extractAllTo(PathToInstall, true);
  return Release;
}

export async function DownloadServer(Platform: bdsTypes.Platform, Version: string|boolean) {
  const ServerPath = path.resolve(process.env.SERVERPATH||path.join(os.homedir(), "bds_core/servers"), Platform);
  const versions = await getVersions()
  const info = versions.platform.filter(v => v.name === Platform).find(v => v.version === (typeof Version === "boolean"?versions.latest[Platform]:Version));
  if (Platform === "bedrock") {
    const BedrockPath = path.resolve(ServerPath);
    if (!(await fs.existsSync(BedrockPath))) fs.mkdirSync(BedrockPath, {recursive: true});
    const BedrockZip = new adm_zip(await getBuffer(info.data[process.platform][process.arch]));
    BedrockZip.extractAllTo(BedrockPath, true);
  } else if (Platform === "java") {
    const JavaPath = path.resolve(ServerPath);
    if (!(await fs.existsSync(JavaPath))) fs.mkdirSync(JavaPath, {recursive: true});
    await fs.promises.writeFile(path.resolve(JavaPath, "Server.jar"), await getBuffer(String(info.data)));
  } else if (Platform === "spigot") {
    const SpigotPath = path.resolve(ServerPath);
    if (!(await fs.existsSync(SpigotPath))) fs.mkdirSync(SpigotPath, {recursive: true});
    await fs.promises.writeFile(path.resolve(SpigotPath, "Spigot.jar"), await getBuffer(String(info.data)));
  } else if (Platform === "pocketmine") {
    const PocketminePath = path.resolve(ServerPath);
    if (!(await fs.existsSync(PocketminePath))) fs.mkdirSync(PocketminePath, {recursive: true});
    await InstallPHP(PocketminePath);
    await fs.promises.writeFile(path.resolve(PocketminePath, "PocketMine.phar"), await getBuffer(String(info.data)));
  } else if (Platform === "dragonfly") {
    const DragonflyPath = path.resolve(ServerPath);
    if (!(await fs.existsSync(DragonflyPath))) fs.mkdirSync(DragonflyPath, {recursive: true});
    await fs.promises.writeFile(path.resolve(DragonflyPath, "Dragonfly"+(process.platform === "win32"?".exe":"")), await getBuffer(String(info.data)));
  }
  return {
    Version: info.version,
    Date: new Date(info.Date),
    url: (typeof info.data === "string"? info.data : info.data[process.platform][process.arch])
  };
}