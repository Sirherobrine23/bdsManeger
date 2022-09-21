import path from "node:path";
import fs from "node:fs/promises";
import fsOld from "node:fs";
import os from "node:os";
import plugin_maneger from "./plugin/main";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { serverRoot, logRoot } from './pathControl';
import { actions, actionConfig } from './globalPlatfroms';
export const serverPath = path.join(serverRoot, "Papermc");
const jarPath = path.join(serverPath, "server.jar");
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;

export async function installServer(version: string|boolean) {
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});
  await fs.writeFile(jarPath, await platformManeger.paper.getJar(version));
}

export const pluginManger = () => (new plugin_maneger("paper", false)).loadPlugins();
const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run(childProcess) {
      childProcess.runCommand("stop");
    },
  },
  {
    name: "pluginManeger",
    class: () => new plugin_maneger("paper")
  },
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
];

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean}) {
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const args = [];
  if (Config) {
    if (Config.maxFreeMemory) {
      const safeFree = Math.floor(os.freemem() / (1024 * 1024 * 1024))-512;
      if (safeFree > 1000) args.push(`-Xms${safeFree}m`);
      else console.warn("There is little ram available!")
    } else {
      if (Config.minMemory) args.push(`-Xms${Config.minMemory}m`);
      if (Config.maxMemory) args.push(`-Xmx${Config.maxMemory}m`);
    }
  }

  args.push("-jar", jarPath, "nogui");
  const eula = path.join(serverPath, "eula.txt");
  await fs.writeFile(eula, (await fs.readFile(eula, "utf8").catch(() => "eula=false")).replace("eula=false", "eula=true"));
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_spigot_${process.platform}_${process.arch}.stdout.log`);
  return new actions({command: "java", args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}}, serverConfig);
}