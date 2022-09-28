import path from "node:path";
import fs from "node:fs/promises";
import fsOld from "node:fs";
import os from "node:os";
import { actions, actionConfig } from "./globalPlatfroms";
import { getBuffer, getJSON, saveFile } from "./httpRequest";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";

async function listVersions() {
  const data = (await getBuffer("https://hub.spigotmc.org/versions/")).toString("utf8").split("\r").filter(line => /\.json/.test(line)).map(line => {const [, data] = line.match(/>(.*)<\//); return data?.replace(".json", "");}).filter(ver => /^[0-9]+\./.test(ver));
  const data2 = await Promise.all(data.map(async (version) => {
    const data = await getJSON<{name: string, description: string, toolsVersion: number, javaVersions?: number[], refs: {BuildData: string, Bukkit: string, CraftBukkit: string, Spigot: string}}>(`https://hub.spigotmc.org/versions/${version}.json`);
    return {
      version,
      date: new Date((await getJSON(`https://hub.spigotmc.org/stash/rest/api/latest/projects/SPIGOT/repos/spigot/commits/${data.refs.Spigot}/`)).committerTimestamp),
      data,
    };
  }));
  return data2.sort((b, a) => a.date.getTime() - b.date.getTime());
}

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("spigot", platformOptions);
  const jarPath = path.join(serverPath, "server.jar");
  if (typeof version === "boolean"||version === "latest") version = (await listVersions())[0].version;
  await fs.cp(await saveFile(`https://github.com/The-Bds-Maneger/SpigotBuilds/releases/download/${version}/Spigot.jar`), jarPath, {force: true});
  return;
}


export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
export const playerAction = /\[.*\]:\s+([\S\w]+)\s+(joined|left|lost)/;
const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run: (child) => child.runCommand("stop")
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
      if (serverPort) {
        let [,, host, port] = serverPort;
        if (host === "*"||!host) host = "127.0.0.1";
        return done({
          port: parseInt(port),
          type: "TCP",
          host: host,
          protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6"
        });
      }
    }
  },
  {
    name: "playerAction",
    callback(data, playerConect, playerDisconnect, playerUnknown) {
      if (playerAction.test(data)) {
        const [, playerName, action] = data.match(data)||[];
        if (action === "joined") playerConect({playerName, connectTime: new Date()});
        else if (action === "left") playerDisconnect({playerName, connectTime: new Date()});
        else if (action === "lost") playerUnknown({playerName, connectTime: new Date(), action: "lost"});
        else playerUnknown({playerName, connectTime: new Date()});
      }
    },
  },
];

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean, platformOptions?: bdsPlatformOptions}) {
  const { serverPath, logsPath, id } = await pathControl("spigot", Config?.platformOptions||{id: "default"});
  const jarPath = path.join(serverPath, "server.jar");
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const args = [];
  if (Config) {
    if (Config.maxFreeMemory) {
      const safeFree = Math.floor(os.freemem()/1e6)-512;
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
  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.log`);
  return new actions({
    id,
    processConfig: {command: "java", args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: serverConfig
  });
}
