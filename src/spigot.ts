import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { serverRoot, logRoot } from './pathControl';
import { exec } from "./childPromisses";
import { actions, actionConfig } from './globalPlatfroms';
import { getBuffer } from "./httpRequest";
export const serverPath = path.join(serverRoot, "spigot");
const jarPath = path.join(serverPath, "server.jar");
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
// [18:38:32] [Network Listener - #3/INFO]: [Geyser-Spigot] Started Geyser on 0.0.0.0:19132
export const geyserPortListen = /^\[.*\]\s+Started\s+Geyser\s+on\s+(([a-zA-Z0-9\.:]+):([0-9]+))/;

// Geyser Plugin
export const floodgatePlugin = "https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/spigot/build/libs/floodgate-spigot.jar";
export const geyserPlugin = "https://ci.opencollab.dev//job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/target/Geyser-Spigot.jar";

export async function installServer(version: string|boolean) {
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await fs.writeFile(jarPath, await platformManeger.spigot.getJar(version));
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
    name: "portListening",
    callback(data, done) {
      const portParse = data.match(geyserPortListen);
      if (!portParse) return;
      let [,, host, port] = portParse;
      if (host === "*"||!host) host = "127.0.0.1";
      done({
        port: parseInt(port),
        type: "UDP",
        host: host,
        protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
        plugin: "geyser"
      });
    }
  },
  {
    name: "serverStop",
    run: (child) => child.writeStdin("stop")
  }
];

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, configureGeyser?: boolean}) {
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const args = [];
  if (Config) {
    if (Config.minMemory) args.push(`-Xms${Config.minMemory}m`);
    if (Config.maxMemory) args.push(`-Xmx${Config.maxMemory}m`);
    if (Config.configureGeyser) {
      const pluginPath = path.join(serverPath, "plugins");
      if (!fsOld.existsSync(pluginPath)) await fs.mkdir(pluginPath, {recursive: true});
      await fs.writeFile(path.join(pluginPath, "floodgate-spigot.jar"), await getBuffer(floodgatePlugin));
      await fs.writeFile(path.join(pluginPath, "geyser-spigot.jar"), await getBuffer(geyserPlugin));
    }
  }

  args.push("-jar", jarPath);
  const eula = path.join(serverPath, "eula.txt");
  await fs.writeFile(eula, (await fs.readFile(eula, "utf8").catch(() => "eula=false")).replace("eula=false", "eula=true"));
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_spigot_${process.platform}_${process.arch}.stdout.log`);
  return new actions(exec("java", args, {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}), serverConfig);
}
