import { getCacheVersions } from "./listVersion.js";
import { serverManeger } from "../../serverRun.js";
import semver from "semver";

export type platforms = "mojang"|"pocketmine"|"powernukkit"|"nukkit"|"cloudburst";
export async function installServer({platform, version}: {platform?: platforms, version?: string} = {}) {
  if (!platform) platform = "mojang";
  else if ((!(["mojang", "pocketmine", "powernukkit", "nukkit", "cloudburst"]).includes(platform))) throw new Error("Invalid platform");
  const versions = getCacheVersions();
  const getLatest = (keys: IterableIterator<string>|string[]) => Array.from(keys).sort((b, a) => semver.compare(semver.valid(semver.coerce(a)), semver.valid(semver.coerce(b)))).at(0);
  if (!version) version = "latest";
  if (platform === "mojang") {
    if (version === "latest") version = getLatest(Object.keys(versions.mojang));
    const release = versions.mojang[version];
    if (!release) throw new Error("Not valid Release");
  }
}

export async function runServer() {}