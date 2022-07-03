import path from "node:path";
import fs from "node:fs";
import adm_zip from "adm-zip";
import * as versionManeger from "@the-bds-maneger/server_versions";
import * as httpRequests from "../lib/HttpRequests";
import { runCommandAsync } from "../lib/childProcess"
import { serverRoot } from "../pathControl";

export async function download(version: string|boolean) {
  const ServerPath = path.join(serverRoot, "bedrock");
  if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
  let arch = process.arch;
  if (process.platform === "linux" && process.arch !== "x64") {
    const existQemu = await runCommandAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false);
    if (existQemu) arch = "x64";
  }
  const bedrockInfo = await versionManeger.findUrlVersion("bedrock", version, arch);
  const BedrockZip = new adm_zip(await httpRequests.getBuffer(bedrockInfo.url));
  let realPathWorldBedrock = "";
  if (fs.existsSync(path.resolve(ServerPath, "worlds"))) {
    if (fs.lstatSync(path.resolve(ServerPath, "worlds")).isSymbolicLink()) {
      realPathWorldBedrock = await fs.promises.realpath(path.resolve(ServerPath, "worlds"));
      await fs.promises.unlink(path.resolve(ServerPath, "worlds"));
    }
  }
  let ServerProperties = "";
  if (fs.existsSync(path.resolve(ServerPath, "server.properties"))) {
    ServerProperties = await fs.promises.readFile(path.resolve(ServerPath, "server.properties"), "utf8");
    await fs.promises.rm(path.resolve(ServerPath, "server.properties"));
  }
  BedrockZip.extractAllTo(ServerPath, true);
  if (!!realPathWorldBedrock) await fs.promises.symlink(realPathWorldBedrock, path.resolve(ServerPath, "worlds"), "dir");
  if (!!ServerProperties) await fs.promises.writeFile(path.resolve(ServerPath, "server.properties"), ServerProperties, "utf8");

  // Return info
  return {
    version: bedrockInfo.version,
    publishDate: bedrockInfo.datePublish,
    url: bedrockInfo.url,
  };
}