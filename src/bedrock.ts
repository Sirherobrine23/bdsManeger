import * as path from "node:path";
import * as fsOld from "node:fs";
import * as fs from "node:fs/promises";
import { promisify } from "node:util";
import { getBedrockZip } from "@the-bds-maneger/server_versions";
import admZip from "adm-zip";
import { exec, execAsync } from "./childPromisses";
import { serverRoot } from "./pathControl";
import { actions, actionConfig } from "./globalPlatfroms";
export const serverPath = path.join(serverRoot, "Bedrock");
export { bedrockServerWorld, bedrockWorld, linkBedrock } from "./linkWorlds/bedrock_pocketmine";

// RegExp
export const saveFf = /^(worlds|server\.properties|config|((permissions|allowlist|valid_known_packs)\.json)|(development_.*_packs))$/;
export const portListen = /(IPv[46])\s+supported,\s+port:\s+(.*)/;
export const started = /\[.*\]\s+Server\s+started\./;
export const player = /r\s+(.*)\:\s+(.*)\,\s+xuid\:\s+(.*)/;

export async function installServer(version: string|boolean) {
  let arch = process.arch;
  if (process.platform === "linux" && process.arch !== "x64") {
    if (await execAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false)||await execAsync("command -v box64").then(() => true).catch(() => false)) arch = "x64";
  }
  const zip = new admZip(await getBedrockZip(version, arch));
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  // Remover files
  for (const file of await fs.readdir(serverPath).then(files => files.filter(file => !saveFf.test(file)))) await fs.rm(path.join(serverPath, file), {recursive: true, force: true});
  const serverConfig = (await fs.readFile(path.join(serverPath, "server.properties"), "utf8").catch(() => "")).trim();
  await promisify(zip.extractAllToAsync)(serverPath, true, true);
  if (serverConfig) await fs.writeFile(path.join(serverPath, "server.properties"), serverConfig);
}

const serverConfig: actionConfig[] = [
  {
    name: "portListening",
    callback(data, done) {
      const match = data.match(portListen);
      if (!match) return;
      const [, protocol, port] = match;
      done({port: parseInt(port), type: "UDP", host: "127.0.0.1", protocol: protocol?.trim() === "IPv4" ? "IPv4" : protocol?.trim() === "IPv6" ? "IPv6" : "Unknown"});
    }
  },
  {
    name: "serverStarted",
    callback(data, done) {
      const resulter = data.match(started);
      if (resulter) done(new Date());
    },
  },
  {
    name: "playerConnect",
    callback(data, done) {
      const match = data.match(player);
      if (!match) return;
      const [, action, playerName, xuid] = match;
      if (action === "connect") done({connectTime: new Date(), playerName: playerName, xuid});
    }
  },
  {
    name: "playerDisconnect",
    callback(data, done) {
      const match = data.match(player);
      if (!match) return;
      const [, action, playerName, xuid] = match;
      if (action === "disconnect") done({connectTime: new Date(), playerName: playerName, xuid});
    }
  },
  {
    name: "playerUnknown",
    callback(data, done) {
      const match = data.match(player);
      if (!match) return;
      const [, action, playerName, xuid] = match;
      if (!(action === "disconnect" || action === "connect")) done({connectTime: new Date(), playerName: playerName, xuid});
    }
  },
  {
    name: "serverStop",
    run: (child) => child.writeStdin("stop")
  }
];

export async function startServer() {
  if (!fsOld.existsSync(serverPath)) throw new Error("Install server fist");
  const args: string[] = [];
  let command = path.join(serverPath, "bedrock_server");
  if (process.platform === "linux" && process.arch !== "x64") {
    args.push(command);
    if (await execAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false)) command = "qemu-x86_64-static";
    else if (await execAsync("command -v box64").then(() => true).catch(() => false)) command = "box64";
    else throw new Error("Cannot emulate x64 architecture. Check the documentents in \"https://github.com/The-Bds-Maneger/Bds-Maneger-Core/wiki/Server-Platforms#minecraft-bedrock-server-alpha\"");
  }

  return new actions(exec(command, args, {cwd: serverPath, maxBuffer: Infinity, env: {LD_LIBRARY_PATH: process.platform === "win32"?undefined:serverPath}}), serverConfig);
}