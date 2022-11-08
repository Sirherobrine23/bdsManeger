import { httpRequest, httpRequestLarge, httpRequestGithub } from "@the-bds-maneger/core-utils";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import * as globalPlatfroms from "./globalPlatfroms";
import Proprieties from "./utils/Proprieties"
import fsOld from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

async function listVersions() {
  const data = (await httpRequest.bufferFetch("https://hub.spigotmc.org/versions/")).data.toString("utf8").split("\r").filter(line => /\.json/.test(line)).map(line => {const [, data] = line.match(/>(.*)<\//); return data?.replace(".json", "");}).filter(ver => /^[0-9]+\./.test(ver));
  const data2 = await Promise.all(data.map(async (version) => {
    const data = await httpRequest.getJSON<{name: string, description: string, toolsVersion: number, javaVersions?: number[], refs: {BuildData: string, Bukkit: string, CraftBukkit: string, Spigot: string}}>(`https://hub.spigotmc.org/versions/${version}.json`);
    return {
      version,
      date: new Date((await httpRequest.getJSON(`https://hub.spigotmc.org/stash/rest/api/latest/projects/SPIGOT/repos/spigot/commits/${data.refs.Spigot}/`)).committerTimestamp),
      data,
    };
  }));
  return data2.sort((b, a) => a.date.getTime() - b.date.getTime());
}

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, id } = await pathControl("spigot", platformOptions);
  const jarPath = path.join(serverPath, "server.jar");
  if (typeof version === "boolean"||version === "latest") version = (await listVersions())[0].version;
  const url = `https://github.com/The-Bds-Maneger/SpigotBuilds/releases/download/${version}/Spigot.jar`;
  await httpRequestLarge.saveFile({url, filePath: jarPath});
  return {
    id, url,
    version: version,
    date: new Date((await httpRequestGithub.GithubRelease("The-Bds-Maneger", "SpigotBuilds", version)).created_at),
  };
}


export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
export const playerAction = /\[.*\]:\s+([\S\w]+)\s+(joined|left|lost)/;
export const serverConfig: globalPlatfroms.actionsV2 = {
  serverStarted(data, done) {
    // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
    if (started.test(data)) done(new Date());
  },
  portListening(data, done) {
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
  },
  playerAction(data, playerConnect, playerDisconnect, playerUnknown) {
    if (playerAction.test(data)) {
      const [, playerName, action] = data.match(data)||[];
      if (action === "joined") playerConnect({playerName, connectTime: new Date()});
      else if (action === "left") playerDisconnect({playerName, connectTime: new Date()});
      else if (action === "lost") playerUnknown({playerName, connectTime: new Date(), action: "lost"});
      else playerUnknown({playerName, connectTime: new Date()});
    }
  },
  stopServer(components) {
    components.actions.runCommand("stop");
    return components.actions.waitExit();
  },
};

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean, platformOptions?: bdsPlatformOptions}) {
  const { serverPath, logsPath, id } = await pathControl("spigot", Config?.platformOptions||{id: "default"});
  const jarPath = path.join(serverPath, "server.jar");
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const args = [
    "-XX:+UseG1GC",
    "-XX:+ParallelRefProcEnabled",
    "-XX:MaxGCPauseMillis=200",
    "-XX:+UnlockExperimentalVMOptions",
    "-XX:+DisableExplicitGC",
    "-XX:+AlwaysPreTouch",
    "-XX:G1NewSizePercent=30",
    "-XX:G1MaxNewSizePercent=40",
    "-XX:G1HeapRegionSize=8M",
    "-XX:G1ReservePercent=20",
    "-XX:G1HeapWastePercent=5",
    "-XX:G1MixedGCCountTarget=4",
    "-XX:InitiatingHeapOccupancyPercent=15",
    "-XX:G1MixedGCLiveThresholdPercent=90",
    "-XX:G1RSetUpdatingPauseTimePercent=5",
    "-XX:SurvivorRatio=32",
    "-XX:+PerfDisableSharedMem",
    "-XX:MaxTenuringThreshold=1",
    "-Dusing.aikars.flags=https://mcflags.emc.gs",
    "-Daikars.new.flags=true",
    "-XX:+UnlockDiagnosticVMOptions",
    "-XX:-UseAESCTRIntrinsics"
  ];
  if (Config) {
    if (Config.maxFreeMemory) {
      const safeFree = Math.floor(os.freemem()/1e6);
      if (safeFree > 1000) Config.maxMemory = safeFree;
      else console.warn("There is little ram available!")
    }
    if (Config.maxMemory) args.push(`-Xmx${Config.maxMemory}m`);
    if (Config.minMemory) args.push(`-Xms${Config.minMemory}m`);
  }

  args.push("-jar", jarPath, "nogui");
  const eula = path.join(serverPath, "eula.txt");
  await fs.readFile(eula, "utf8").catch(() => "eula=false").then(eulaFile => fs.writeFile(eula, eulaFile.replace("eula=false", "eula=true")));
  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.log`);
  return globalPlatfroms.actionV2({
    id, platform: "spigot",
    processConfig: {command: "java", args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: serverConfig
  });
}

export type baseConfig = {
  "gamemode": string,
  "level-name": string,
  "level-seed": number,
  "pvp": boolean,
  "difficulty": "easy"|"normal"|"hard",
  "hardcore": boolean,
  "motd": string,
  "server-port": number,
  "enforce-secure-profile": boolean,
  "require-resource-pack": boolean,
  "max-players": number,
  "online-mode": boolean,
  "enable-status": boolean,
  "allow-flight": boolean,
  "view-distance": number,
  "simulation-distance": number,
  "player-idle-timeout": number,
  "force-gamemode": boolean,
  "white-list": boolean,
  "spawn-animals": boolean,
  "enforce-whitelist": boolean,
  "enable-command-block": boolean,
};

export type ignoreBaseConfig = {
  "query.port": number,
  "enable-jmx-monitoring": boolean,
  "rcon.port": number,
  "enable-query": boolean,
  "generator-settings": "{}"|string,
  "generate-structures": boolean,
  "max-chained-neighbor-updates": number,
  "network-compression-threshold": number,
  "max-tick-time": number,
  "use-native-transport": boolean,
  "broadcast-rcon-to-ops": boolean,
  "server-ip": string,
  "resource-pack-prompt": any,
  "allow-nether": boolean,
  "enable-rcon": boolean,
  "sync-chunk-writes": boolean,
  "op-permission-level": number,
  "prevent-proxy-connections": boolean,
  "hide-online-players": boolean,
  "resource-pack": any,
  "entity-broadcast-range-percentage": number,
  "rcon.password": string,
  "debug": boolean,
  "rate-limit": number,
  "broadcast-console-to-ops": boolean,
  "spawn-npcs": boolean,
  "previews-chat": boolean,
  "function-permission-level": number,
  "level-type": "minecraft\\:normal"|string,
  "text-filtering-config": any,
  "spawn-monsters": boolean,
  "spawn-protection": number,
  "resource-pack-sha1": any|string,
  "max-world-size": number
}

export type spigotProprieties = baseConfig & ignoreBaseConfig;

export async function getConfig(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("spigot", platformOptions);
  return Proprieties.parse<spigotProprieties>(await fs.readFile(path.join(serverPath, "server.properties"), "utf8"));
}

// This is a fast and dirty way to implement a new feature, but i'm too exhausted to implement the same type as bedrock
export async function updateConfig(config: {key: string, value: any}, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const currentConfig = await getConfig(platformOptions);
  const { serverPath } = await pathControl("spigot", platformOptions);
  currentConfig[config.key] = config.value;
  return fs.writeFile(path.join(serverPath, "server.properties"), Proprieties.stringify(currentConfig));
}
