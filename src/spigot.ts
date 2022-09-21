import path from "node:path";
import fs from "node:fs/promises";
import fsOld from "node:fs";
import os from "node:os";
import plugin_maneger from "./plugin/java";
import { serverRoot, logRoot, BuildRoot } from './pathControl';
import { execFileAsync } from "./childPromisses";
import { actions, actionConfig } from './globalPlatfroms';
import { getBuffer } from "./httpRequest";

export const serverPath = path.join(serverRoot, "spigot");
export const serverPathBuild = path.join(BuildRoot, "spigot");
const jarPath = path.join(serverPath, "server.jar");
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
// [18:38:32] [Network Listener - #3/INFO]: [Geyser-Spigot] Started Geyser on 0.0.0.0:19132
export const geyserPortListen = /^\[.*\].*Geyser.*\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-zA-Z0-9:]+):([0-9]+))/;
// [00:40:18] [Server thread/INFO]: [dynmap] Web server started on address 0.0.0.0:8123
export const DynmapPortListen = /^\[.*\].*\[dynmap\].*\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-zA-Z0-9:]+):([0-9]+))/;

export async function installServer(version: string|boolean) {
  if (!fsOld.existsSync(serverPath)) await fs.mkdir(serverPath, {recursive: true});

  if (!fsOld.existsSync(serverPathBuild)) await fs.mkdir(serverPathBuild, {recursive: true});
  if (typeof version === "boolean") version = "latest";
  await fs.writeFile(path.join(serverPathBuild, "buildSpigot.jar"), await getBuffer("https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar"));
  await execFileAsync("java", ["-jar", path.join(serverPathBuild, "buildSpigot.jar"), "-o", path.join(serverPathBuild, "output"), "--rev", version], {stdio: "inherit", cwd: serverPathBuild});

  await fs.cp(path.join(serverPathBuild, "output", (await fs.readdir(path.join(serverPathBuild, "output")))[0]), jarPath, {force: true, preserveTimestamps: true});
  await fs.rm(path.join(serverPathBuild, "output"), {recursive: true, force: true});
}

export const pluginManger = () => (new plugin_maneger("spigot", false)).loadPlugins();
const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run: (child) => child.runCommand("stop")
  },
  {
    name: "pluginManeger",
    class: () => new plugin_maneger("spigot")
  },
  {
    name: "serverStarted",
    callback(data, done) {
      // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
      if (started.test(data)) done(new Date());
    }
  },
  // Serverr
  {
    name: "portListening",
    callback(data, done) {
      const serverPort = data.match(portListen);
      const geyserPort = data.match(geyserPortListen);
      const dynmapPort = data.match(DynmapPortListen);
      if (serverPort) {
        let [,, host, port] = serverPort;
        if (host === "*"||!host) host = "127.0.0.1";
        return done({
          port: parseInt(port),
          type: "TCP",
          host: host,
          protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6"
        });
      } else if (dynmapPort) {
        let [,, host, port] = dynmapPort;
        if (host === "*"||!host) host = "127.0.0.1";
        return done({
          port: parseInt(port),
          type: "TCP",
          host: host,
          protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
          plugin: "dynmap"
        });
      } else if (geyserPort) {
        let [,, host, port] = geyserPort;
        if (host === "*"||!host) host = "127.0.0.1";
        return done({
          port: parseInt(port),
          type: "UDP",
          host: host,
          protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
          plugin: "geyser"
        });
      }
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
  await fs.readFile(eula, "utf8").catch(() => "eula=false").then(eulaFile => fs.writeFile(eula, eulaFile.replace("eula=false", "eula=true")));
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_spigot_${process.platform}_${process.arch}.stdout.log`);
  return new actions({command: "java", args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}}, serverConfig);
}