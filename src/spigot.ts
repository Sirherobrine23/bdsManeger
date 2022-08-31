import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import { getSpigotJar } from "@the-bds-maneger/server_versions";
import { serverRoot } from "./pathControl";
import { exec } from "./childPromisses";
import { actions, actionConfig } from './globalPlatfroms';
export const serverPath = path.join(serverRoot, "spigot");
const jarPath = path.join(serverPath, "server.jar");
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;

export async function installServer(version: string|boolean) {
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await fs.writeFile(jarPath, await getSpigotJar(version));
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
      if (!portParse) return;
      let [,, host, port] = portParse;
      if (host === "*"||!host) host = "127.0.0.1";
      done({
        port: parseInt(port),
        type: "TCP",
        host: host,
        protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6"
      });
    }
  },
  {
    name: "serverStop",
    run: (child) => child.writeStdin("stop")
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
  const eula = path.join(serverPath, "eula.txt");
  await fs.writeFile(eula, (await fs.readFile(eula, "utf8").catch(() => "eula=false")).replace("eula=false", "eula=true"));
  return new actions(exec(command, args, {cwd: serverPath, maxBuffer: Infinity}), serverConfig);
}
