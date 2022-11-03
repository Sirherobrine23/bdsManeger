import { getJSON } from "@http/simples";
import { java } from "../db/java";
import { javaRelease } from "./types/Java";

async function Add(Version: string, versionDate: Date, url: string): Promise<void> {
  if (await java.findOne({ version: Version }).lean().then(data => !!data).catch(() => true)) return;
  else {
    console.log("Java: Version '%s', url '%s'", Version, url);
    await java.create({
      version: Version,
      date: versionDate,
      latest: false,
      url: url
    });
  }
}

type version_manifest_v2 = {latest: {release: string, snapshot: string, }, versions: {id: string, type: "snapshot"|"release", url: string, time: string, releaseTime: string, sha1: string, complianceLevel: number}[]}

async function Find() {
  const Versions = await getJSON<version_manifest_v2>("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json");
  for (const ver of Versions.versions.filter(a => a.type === "release")) {
    const Release = await getJSON<javaRelease>(ver.url);
    if (!!Release?.downloads?.server?.url) await Add(ver.id, new Date(ver.releaseTime), Release?.downloads?.server?.url);
  }
  return await java.findOneAndUpdate({version: Versions.latest.release}, {$set: {latest: true}}).lean();
}

export default async function UpdateDatabase() {
  const latestVersion = await java.findOneAndUpdate({latest: true}, {$set: {latest: false}}).lean();
  return {
    new: await Find(),
    old: latestVersion
  };
}
