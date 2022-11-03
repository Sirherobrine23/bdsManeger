import fsOld from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import { findVersion as getVersions, bedrock, java, paper, pocketmine, powernukkit, spigot } from "./index";

const rootVersions = path.join(process.cwd(), "versions");
const Bedrock = path.join(rootVersions, "bedrock");
const Pocketmine = path.join(rootVersions, "pocketmine");
const Powernukkit = path.join(rootVersions, "powernukkit");
const Java = path.join(rootVersions, "java");
const Spigot = path.join(rootVersions, "spigot");
const Paper = path.join(rootVersions, "paper");

(async function(){
  if (!fsOld.existsSync(rootVersions)) await fs.mkdir(rootVersions, {recursive: true});
  if (!fsOld.existsSync(Bedrock)) await fs.mkdir(Bedrock, {recursive: true});
  if (!fsOld.existsSync(Pocketmine)) await fs.mkdir(Pocketmine, {recursive: true});
  if (!fsOld.existsSync(Powernukkit)) await fs.mkdir(Powernukkit, {recursive: true});
  if (!fsOld.existsSync(Java)) await fs.mkdir(Java, {recursive: true});
  if (!fsOld.existsSync(Spigot)) await fs.mkdir(Spigot, {recursive: true});
  if (!fsOld.existsSync(Paper)) await fs.mkdir(Paper, {recursive: true});

  const bedrockData = await getVersions<bedrock[]>("bedrock", "all", true);
  fs.writeFile(path.join(Bedrock, "latest.json"), JSON.stringify(bedrockData.find(release => release.latest), null, 2));
  fs.writeFile(path.join(Bedrock, "all.json"), JSON.stringify(bedrockData, null, 2));
  await Promise.all(bedrockData.map(async releases => {
    const version = path.join(Bedrock, `${releases.version}.json`);
    await fs.writeFile(version, JSON.stringify(releases, null, 2));
    await fs.utimes(version, new Date(releases.date), new Date(releases.date));
  }));

  const PocketmineData = await getVersions<pocketmine[]>("pocketmine", "all", true);
  fs.writeFile(path.join(Pocketmine, "latest.json"), JSON.stringify(PocketmineData.find(release => release.latest), null, 2));
  fs.writeFile(path.join(Pocketmine, "all.json"), JSON.stringify(PocketmineData, null, 2));
  await Promise.all(PocketmineData.map(async releases => {
    const version = path.join(Pocketmine, `${releases.version}.json`);
    await fs.writeFile(version, JSON.stringify(releases, null, 2));
    await fs.utimes(version, new Date(releases.date), new Date(releases.date));
  }));

  const PowernukkitData = await getVersions<powernukkit[]>("powernukkit", "all", true);
  fs.writeFile(path.join(Powernukkit, "latest.json"), JSON.stringify(PowernukkitData.find(release => release.latest), null, 2));
  fs.writeFile(path.join(Powernukkit, "all.json"), JSON.stringify(PowernukkitData, null, 2));
  await Promise.all(PowernukkitData.map(async releases => {
    const version = path.join(Powernukkit, `${releases.version}.json`);
    await fs.writeFile(version, JSON.stringify(releases, null, 2));
    await fs.utimes(version, new Date(releases.date), new Date(releases.date));
  }));

  const JavaData = await getVersions<java[]>("java", "all", true);
  fs.writeFile(path.join(Java, "latest.json"), JSON.stringify(JavaData.find(release => release.latest), null, 2));
  fs.writeFile(path.join(Java, "all.json"), JSON.stringify(JavaData, null, 2));
  await Promise.all(JavaData.map(async releases => {
    const version = path.join(Java, `${releases.version}.json`);
    await fs.writeFile(version, JSON.stringify(releases, null, 2));
    await fs.utimes(version, new Date(releases.date), new Date(releases.date));
  }));

  const SpigotData = await getVersions<spigot[]>("spigot", "all", true);
  fs.writeFile(path.join(Spigot, "latest.json"), JSON.stringify(SpigotData.find(release => release.latest), null, 2));
  fs.writeFile(path.join(Spigot, "all.json"), JSON.stringify(SpigotData, null, 2));
  await Promise.all(SpigotData.map(async releases => {
    const version = path.join(Spigot, `${releases.version}.json`);
    await fs.writeFile(version, JSON.stringify(releases, null, 2));
    await fs.utimes(version, new Date(releases.date), new Date(releases.date));
  }));

  const PaperData = await getVersions<paper[]>("paper", "all", true);
  fs.writeFile(path.join(Paper, "latest.json"), JSON.stringify(PaperData.find(release => release.latest), null, 2));
  fs.writeFile(path.join(Paper, "all.json"), JSON.stringify(PaperData, null, 2));
  await Promise.all(PaperData.map(async releases => {
    const version = path.join(Paper, `${releases.version}_${releases.build}.json`);
    await fs.writeFile(version, JSON.stringify(releases, null, 2));
    await fs.utimes(version, new Date(releases.date), new Date(releases.date));
  }));
})();