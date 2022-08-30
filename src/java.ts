import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import { getJavaJar } from "@the-bds-maneger/server_versions";
import { serverRoot } from "./pathControl";
import { exec } from "./childPromisses";
import { actions, actionConfig } from './globalPlatfroms';
export const serverPath = path.join(serverRoot, "java");
const jarPath = path.join(serverPath, "server.jar");
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /Starting\s+Minecraft\s+server\s+on\s+(.*)\:(\d+)/;

export async function installServer(version: string|boolean) {
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await fs.writeFile(jarPath, await getJavaJar(version));
}

const serverConfig: actionConfig[] = [
  {
    name: "serverStarted",
    callback(data, done) {
      // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
      if (started.test(data)) done(new Date());
    }
  },
  {
    name: "portListening",
    callback(data, done) {
      const portParse = data.match(portListen);
      if (!!portParse) done({port: parseInt(portParse[2]), host: (portParse[1]||"").trim()||undefined, type: "TCP", protocol: "IPV4/IPv6",});
    }
  }
];

export async function startServer(Config?: {maxMemory?: number, minMemory?: number}) {
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const command = "java";
  const args = ["-jar"];
  if (Config) {
    if (Config?.minMemory) args.push(`-Xms${Config?.minMemory}m`);
    if (Config?.maxMemory) args.push(`-Xmx${Config?.maxMemory}m`);
  }
  args.push(jarPath);
  return new actions(exec(command, args, {cwd: serverPath, maxBuffer: Infinity}), serverConfig);
}