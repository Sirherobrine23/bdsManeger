import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import { platformManeger } from "@the-bds-maneger/server_versions";
import * as yaml from "yaml";
import * as Proprieties from "./Proprieties";
import { serverRoot, logRoot } from './pathControl';
import { exec } from "./childPromisses";
import { actions, actionConfig } from './globalPlatfroms';
import { getBuffer } from "./httpRequest";
export const serverPath = path.join(serverRoot, "spigot");
const jarPath = path.join(serverPath, "server.jar");
export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
// [18:38:32] [Network Listener - #3/INFO]: [Geyser-Spigot] Started Geyser on 0.0.0.0:19132
export const geyserPortListen = /^\[.*\].*Geyser.*\s+(([a-zA-Z0-9\.:]+):([0-9]+))/;
// [00:40:18] [Server thread/INFO]: [dynmap] Web server started on address 0.0.0.0:8123
export const DynmapPortListen = /^\[.*\].*\[dynmap\].*\s+(([a-zA-Z0-9\.:]+):([0-9]+))/;

// Geyser Plugin
export const floodgatePlugin = "https://ci.opencollab.dev/job/GeyserMC/job/Floodgate/job/master/lastSuccessfulBuild/artifact/spigot/build/libs/floodgate-spigot.jar";
export const geyserPlugin = "https://ci.opencollab.dev//job/GeyserMC/job/Geyser/job/master/lastSuccessfulBuild/artifact/bootstrap/spigot/target/Geyser-Spigot.jar";
export const DynmapPlugin = "https://dev.bukkit.org/projects/dynmap/files/latest";

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
  // Serverr
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
  // Geyser Plugin
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
  // Dynmap
  {
    name: "portListening",
    callback(data, done) {
      const portParse = data.match(DynmapPortListen);
      if (!portParse) return;
      console.log("Dynmap, %o", portParse);
      let [,, host, port] = portParse;
      if (host === "*"||!host) host = "127.0.0.1";
      done({
        port: parseInt(port),
        type: "UDP",
        host: host,
        protocol: /::/.test(host?.trim())?"IPv6":/[0-9]+\.[0-9]+/.test(host?.trim())?"IPv4":"IPV4/IPv6",
        plugin: "dynmap"
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
      await fs.writeFile(path.join(pluginPath, "dynmap.jar"), await getBuffer(DynmapPlugin));
    }
    const geyserConfig = path.join(serverPath, "plugins/Geyser-Spigot/config.yml");
    if (fsOld.existsSync(geyserConfig)) await getConfig().then(res => fs.readFile(geyserConfig, "utf8").then(file => {
      const geyser = yaml.parse(file);
      geyser.remote.port = res.proprieties.serverPort;
      return yaml.stringify(geyser);
    })).catch(() => null);
  }

  args.push("-jar", jarPath, "nogui");
  const eula = path.join(serverPath, "eula.txt");
  await fs.writeFile(eula, (await fs.readFile(eula, "utf8").catch(() => "eula=false")).replace("eula=false", "eula=true"));
  const logFileOut = path.join(logRoot, `bdsManeger_${Date.now()}_spigot_${process.platform}_${process.arch}.stdout.log`);
  return new actions(exec("java", args, {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}), serverConfig);
}

//
export const configPaths = {
  yaml: path.join(serverPath, "spigot.yml"),
  proprieties: path.join(serverPath, "server.properties")
};

export type spigotProprieties = {
  enablejmxMonitoring: boolean,
  rconPort: number,
  levelSeed: any,
  gamemode: string,
  enableCommandBlock: boolean,
  enableQuery: boolean,
  generatorSettings: string,
  enforceSecureProfile: boolean,
  levelName: string,
  motd: string,
  queryPort: number,
  pvp: boolean,
  generateStructures: boolean,
  maxChainedNeighborUpdates: number,
  difficulty: string,
  networkCompressionThreshold: number,
  maxTickTime: number,
  requireResourcePack: boolean,
  useNativeTransport: boolean,
  maxPlayers: number,
  onlineMode: boolean,
  enableStatus: boolean,
  allowFlight: boolean,
  broadcastRconToOps: boolean,
  viewDistance: number,
  serverip: any,
  resourcePackPrompt: any,
  allowNether: boolean,
  serverPort: number,
  enableRcon: boolean,
  syncChunkWrites: boolean,
  opPermissionLevel: number,
  preventProxyConnections: boolean,
  hideOnlinePlayers: boolean,
  resourcePack: any,
  entityBroadcastRangePercentage: number,
  simulationDistance: number,
  rconPassword: any,
  playerIdleTimeout: number,
  debug: boolean,
  forceGamemode: boolean,
  rateLimit: number,
  hardcore: boolean,
  whiteList: boolean,
  broadcastConsoleToOps: boolean,
  spawnNpcs: boolean,
  previewsChat: boolean,
  spawnAnimals: boolean,
  functionPermissionLevel: number,
  levelType: string,
  textFilteringConfig: any,
  spawnMonsters: boolean,
  enforceWhitelist: boolean,
  spawnProtection: number,
  resourcePackSha1: any,
  maxWorldSize: number,
}

type SpigotYml = {
  settings: {
    debug: boolean,
    sampleCount: number,
    bungeecord: boolean,
    playerShuffle: number,
    userCacheSize: number,
    saveUserCacheOnStopOnly: boolean,
    movedWronglyThreshold: number,
    movedTooQuicklyMultiplier: number,
    timeoutTime: number,
    restartOnCrash: boolean,
    restartScript: string,
    nettyThreads: number,
    attribute: {
      maxHealth: {
        max: number,
      },
      movementSpeed: {
        max: number,
      },
      attackDamage: {
        max: number,
      },
    },
    logVillagerDeaths: boolean,
    logNamedDeaths: boolean,
  },
  messages: {
    whitelist: string,
    unknownCommand: string,
    serverFull: string,
    outdatedClient: string,
    outdatedServer: string,
    restart: string,
  },
  commands: {
    replaceCommands: string[],
    spamExclusions: string[],
    silentCommandblockConsole: boolean,
    log: boolean,
    tabComplete: number,
    sendNamespaced: boolean,
  },
  worldSettings: {
    default: {
      belowZeroGenerationInExistingChunks: boolean,
      verbose: boolean,
      entityActivationRange: {
        animals: number,
        monsters: number,
        raiders: number,
        misc: number,
        tickInactiveVillagers: boolean,
        ignoreSpectators: boolean,
      },
      entityTrackingRange: {
        players: number,
        animals: number,
        monsters: number,
        misc: number,
        other: number,
      },
      ticksPer: {
        hopperTransfer: number,
        hopperCheck: number,
      },
      hopperAmount: number,
      hopperCanLoadChunks: boolean,
      dragonDeathSoundRadius: number,
      seedVillage: number,
      seedDesert: number,
      seedIgloo: number,
      seedJungle: number,
      seedSwamp: number,
      seedMonument: number,
      seedShipwreck: number,
      seedOcean: number,
      seedOutpost: number,
      seedEndcity: number,
      seedSlime: number,
      seedNether: number,
      seedMansion: number,
      seedFossil: number,
      seedPortal: number,
      mergeRadius: {
        exp: number,
        item: number,
      },
      mobSpawnRange: number,
      growth: {
        cactusModifier: number,
        caneModifier: number,
        melonModifier: number,
        mushroomModifier: number,
        pumpkinModifier: number,
        saplingModifier: number,
        beetrootModifier: number,
        carrotModifier: number,
        potatoModifier: number,
        wheatModifier: number,
        netherwartModifier: number,
        vineModifier: number,
        cocoaModifier: number,
        bambooModifier: number,
        sweetberryModifier: number,
        kelpModifier: number,
      },
      hunger: {
        jumpWalkExhaustion: number,
        jumpSprintExhaustion: number,
        combatExhaustion: number,
        regenExhaustion: number,
        swimMultiplier: number,
        sprintMultiplier: number,
        otherMultiplier: number,
      },
      maxTntPerTick: number,
      maxTickTime: {
        tile: number,
        entity: number,
      },
      itemDespawnRate: number,
      viewDistance: string,
      simulationDistance: string,
      thunderChance: number,
      enableZombiePigmenPortalSpawns: boolean,
      witherSpawnSoundRadius: number,
      hangingTickFrequency: number,
      arrowDespawnRate: number,
      tridentDespawnRate: number,
      zombieAggressiveTowardsVillager: boolean,
      nerfSpawnerMobs: boolean,
      endPortalSoundRadius: number,
    },
  },
  advancements: {
    disableSaving: boolean,
    disabled: string[],
  },
  players: {
    disableSaving: boolean,
  },
  configVersion: number,
  stats: {
    disableSaving: boolean,
    forcedStats: {},
  },
};

export async function getConfig() {
  if (!(fsOld.existsSync(configPaths.yaml)||fsOld.existsSync(configPaths.proprieties))) throw new Error("Start server");
  const spigotYml = yaml.parse(await fs.readFile(configPaths.yaml, "utf8")) as SpigotYml;
  const prope = Proprieties.parse<spigotProprieties>(await fs.readFile(configPaths.proprieties, "utf8"));
  return {
    yml: spigotYml,
    proprieties: prope
  };
}