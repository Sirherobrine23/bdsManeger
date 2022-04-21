import path from "path";
import { promises as fsPromise } from "fs";
import os from "os";
const serverPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), "bedrock");
/*
#Properties Config file
#Wed Apr 20 23:32:32 UTC 2022
language=eng
motd=PocketMine-MP Server
server-name=PocketMine-MP Server
server-port=19132
server-portv6=19133
gamemode=survival
max-players=20
view-distance=16
white-list=on
enable-query=on
enable-ipv6=on
force-gamemode=off
hardcore=off
pvp=on
difficulty=2
generator-settings=
level-name=world
level-seed=
level-type=DEFAULT
auto-save=on
xbox-auth=on
*/

export type pocketmineConfig = {
  language: "chs"|"deu"|"ell"|"eng"|"fra"|"hrv"|"jpn"|"kor"|"lav"|"nld",
  motd: string,
  port: {
    v4: number,
    v6: number
  },
  whiteList: boolean,
  maxPlayers: number,
  gamemode: "survival"|"creative"|"hardcore",
  forceGamemode: boolean,
  pvp: boolean,
  difficulty: "peaceful"|"easy"|"normal"|"hard",
  worldName: string,
  worldSeed: string,
  worldType: "default"|"flat",
  xboxAuth: boolean
}

export async function CreateServerConfig(config: pocketmineConfig) {
  const lang = config.language||"eng";
  const serverMotd = config.motd||"PocketMine-MP Server";
  const serverPortv4 = config.port.v4||19132;
  const serverPortv6 = config.port.v6||19133;
  const gamemode = config.gamemode||"survival";
  const maxPlayers = config.maxPlayers||20;
  const viewDistance = 16;
  const whiteList = (config.whiteList||false)?"on":"off";
  const enableQuery = (false)?"on":"off";
  const enableIPv6 = (true)? "on":"off";
  const forceGamemode = (true)?"on":"off";
  const hardcore = (gamemode === "hardcore")?"on":"off";
  const pvp = (config.pvp||true)?"on":"off";
  const difficulty = config.difficulty||"normal";
  const generatorSettings = "";
  const levelName = config.worldName||"world";
  const levelSeed = config.worldSeed||"";
  const levelType = config.worldType||"default";
  const autoSave = (true)?"on":"off";
  const xboxAuth = (config.xboxAuth||false)?"on":"off";
  const configPath = path.join(serverPath, "server.properties");
  const configContent = [
    `language=${lang}`,
    `motd=${serverMotd}`,
    `server-port=${serverPortv4}`,
    `server-portv6=${serverPortv6}`,
    `gamemode=${gamemode}`,
    `max-players=${maxPlayers}`,
    `view-distance=${viewDistance}`,
    `white-list=${whiteList}`,
    `enable-query=${enableQuery}`,
    `enable-ipv6=${enableIPv6}`,
    `force-gamemode=${forceGamemode}`,
    `hardcore=${hardcore}`,
    `pvp=${pvp}`,
    `difficulty=${difficulty}`,
    `generator-settings=${generatorSettings}`,
    `level-name=${levelName}`,
    `level-seed=${levelSeed}`,
    `level-type=${levelType}`,
    `auto-save=${autoSave}`,
    `xbox-auth=${xboxAuth}`
  ];
  await fsPromise.writeFile(configPath, configContent.join("\n"));
  return {lang, serverMotd, serverPortv4, serverPortv6, gamemode, maxPlayers, viewDistance, whiteList, enableQuery, enableIPv6, forceGamemode, hardcore, pvp, difficulty, generatorSettings, levelName, levelSeed, levelType, autoSave, xboxAuth};
}

// new config in to pocketmine.yml
// Example
// TODO: yaml lang parse with js-yaml
/*
# Main configuration file for PocketMine-MP
# These settings are the ones that cannot be included in server.properties
# Some of these settings are safe, others can break your server if modified incorrectly
# New settings/defaults won't appear automatically in this file when upgrading.

settings:
  #Whether to send all strings translated to server locale or let the device handle them
  force-language: false
  shutdown-message: "Server closed"
  #Allow listing plugins via Query
  query-plugins: true
  #Enable plugin and core profiling by default
  enable-profiling: false
  #Will only add results when tick measurement is below or equal to given value (default 20)
  profile-report-trigger: 20
  #Number of AsyncTask workers.
  #Used for plugin asynchronous tasks, world generation, compression and web communication.
  #Set this approximately to your number of cores.
  #If set to auto, it'll try to detect the number of cores (or use 2)
  async-workers: auto
  #Whether to allow running development builds. Dev builds might crash, break your plugins, corrupt your world and more.
  #It is recommended to avoid using development builds where possible.
  enable-dev-builds: false

memory:
  #Global soft memory limit in megabytes. Set to 0 to disable
  #This will trigger low-memory-triggers and fire an event to free memory when the usage goes over this
  global-limit: 0

  #Main thread soft memory limit in megabytes. Set to 0 to disable
  #This will trigger low-memory-triggers and fire an event to free memory when the usage goes over this
  main-limit: 0

  #Main thread hard memory limit in megabytes. Set to 0 to disable
  #This will stop the server when the limit is surpassed
  main-hard-limit: 1024

  #AsyncWorker threads' hard memory limit in megabytes. Set to 0 to disable
  #This will crash the task currently executing on the worker if the task exceeds the limit
  #NOTE: THIS LIMIT APPLIES PER WORKER, NOT TO THE WHOLE PROCESS.
  async-worker-hard-limit: 256

  #Period in ticks to check memory (default 1 second)
  check-rate: 20

  #Continue firing low-memory-triggers and event while on low memory
  continuous-trigger: true

  #Only if memory.continuous-trigger is enabled. Specifies the rate in memory.check-rate steps (default 30 seconds)
  continuous-trigger-rate: 30

  garbage-collection:
    #Period in ticks to fire the garbage collector manually (default 30 minutes), set to 0 to disable
    #This only affects the main thread. Other threads should fire their own collections
    period: 36000

    #Fire asynchronous tasks to collect garbage from workers
    collect-async-worker: true

    #Trigger on low memory
    low-memory-trigger: true

  #Settings controlling memory dump handling.
  memory-dump:
    #Dump memory from async workers as well as the main thread. If you have issues with segfaults when dumping memory, disable this setting.
    dump-async-worker: true

  max-chunks:
    #Cap maximum render distance per player when low memory is triggered. Set to 0 to disable cap.
    chunk-radius: 4

    #Do chunk garbage collection on trigger
    trigger-chunk-collect: true

  world-caches:
    #Disallow adding to world chunk-packet caches when memory is low
    disable-chunk-cache: true
    #Clear world caches when memory is low
    low-memory-trigger: true


network:
  #Threshold for batching packets, in bytes. Only these packets will be compressed
  #Set to 0 to compress everything, -1 to disable.
  batch-threshold: 256
  #Compression level used when sending batched packets. Higher = more CPU, less bandwidth usage
  compression-level: 6
  #Use AsyncTasks for compression. Adds half/one tick delay, less CPU load on main thread
  async-compression: false
  #Experimental. Use UPnP to automatically port forward
  upnp-forwarding: false
  #Maximum size in bytes of packets sent over the network (default 1492 bytes). Packets larger than this will be
  #fragmented or split into smaller parts. Clients can request MTU sizes up to but not more than this number.
  max-mtu-size: 1492
  #Enable encryption of Minecraft network traffic. This has an impact on performance, but prevents hackers from stealing sessions and pretending to be other players.
  #DO NOT DISABLE THIS unless you understand the risks involved.
  enable-encryption: true

debug:
  #If > 1, it will show debug messages in the console
  level: 1

player:
  #Choose whether to enable player data saving.
  save-player-data: true
  #If true, checks that joining players' Xbox user ID (XUID) match what was previously recorded.
  #This also prevents non-XBL players using XBL players' usernames to steal their data on servers with xbox-auth=off.
  verify-xuid: true

level-settings:
  #The default format that worlds will use when created
  default-format: leveldb

chunk-sending:
  #To change server normal render distance, change view-distance in server.properties.
  #Amount of chunks sent to players per tick
  per-tick: 4
  #Radius of chunks that need to be sent before spawning the player
  spawn-radius: 4

chunk-ticking:
  #Max amount of chunks processed each tick
  per-tick: 40
  #Radius of chunks around a player to tick
  tick-radius: 3
  #Number of blocks inside ticking areas' subchunks that get ticked every tick. Higher values will accelerate events
  #like tree and plant growth, but at a higher performance cost.
  blocks-per-subchunk-per-tick: 3
  #IDs of blocks not to perform random ticking on.
  disable-block-ticking:
    #- grass
    #- ice
    #- fire

chunk-generation:
  #Max. amount of chunks in the waiting queue to be populated
  population-queue-size: 32

ticks-per:
  autosave: 6000

auto-report:
  #Send crash reports for processing
  enabled: true
  send-code: true
  send-settings: true
  send-phpinfo: false
  use-https: true
  host: crash.pmmp.io

anonymous-statistics:
  #Sends anonymous statistics for data aggregation, plugin usage tracking
  enabled: false #TODO: re-enable this when we have a new stats host
  host: stats.pocketmine.net

auto-updater:
  enabled: true
  on-update:
    warn-console: true
  #Can be development, alpha, beta or stable.
  preferred-channel: stable
  #If using a development version, it will suggest changing the channel
  suggest-channels: true
  host: update.pmmp.io

timings:
  #Choose the host to use for viewing your timings results.
  host: timings.pmmp.io

console:
  #Choose whether to enable server stats reporting on the console title.
  #NOTE: The title ticker will be disabled regardless if console colours are not enabled.
  title-tick: true

aliases:
  ##This section allows you to add, remove or remap command aliases.
  ##A single alias can call one or more other commands (or aliases).
  ##Aliases defined here will override any command aliases declared by plugins or PocketMine-MP itself.

  ##To remove an alias, set it to [], like so (note that prefixed aliases like "pocketmine:stop" will remain and can't
  ##be removed):
  #stop: []

  ##Commands are not removed, only their aliases. You can still refer to a command using its full (prefixed)
  ##name, even if all its aliases are overwritten. The full name is usually something like "pocketmine:commandname" or
  ##"pluginname:commandname".
  #abort: [pocketmine:stop]

  ##To add an alias, list the command(s) that it calls:
  #showtheversion: [version]
  #savestop: [save-all, stop]

  ##To invoke another command with arguments, use $1 to pass the first argument, $2 for the second etc:
  #giveadmin: [op $1] ## `giveadmin alex` -> `op alex`
  #kill: [suicide, say "I tried to kill $1"] ## `kill alex` -> `suicide` + `say "I tried to kill alex"`
  #giverandom: [give $1 $2, say "Someone has just received a $2!"] ## `giverandom alex diamond` -> `give alex diamond` + `say "Someone has just received a diamond!"`

  ##To change an existing command alias and make it do something else:
  #tp: [suicide]

worlds:
  #These settings will override the generator set in server.properties and allows loading multiple worlds
  #Example:
  #world:
  # seed: 404
  # generator: FLAT
  # preset: 2;bedrock,59xstone,3xdirt,grass;1

plugins:
  #Setting this to true will cause the legacy structure to be used where plugin data is placed inside the --plugins dir.
  #False will place plugin data under plugin_data under --data.
  #This option exists for backwards compatibility with existing installations.
  legacy-data-dir: false
*/
// TODO: in json
/*
{
  "settings": {
    "force-language": false,
    "shutdown-message": "Server closed",
    "query-plugins": true,
    "enable-profiling": false,
    "profile-report-trigger": 20,
    "async-workers": "auto",
    "enable-dev-builds": false
  },
  "memory": {
    "global-limit": 0,
    "main-limit": 0,
    "main-hard-limit": 1024,
    "async-worker-hard-limit": 256,
    "check-rate": 20,
    "continuous-trigger": true,
    "continuous-trigger-rate": 30,
    "garbage-collection": {
      "period": 36000,
      "collect-async-worker": true,
      "low-memory-trigger": true
    },
    "memory-dump": {
      "dump-async-worker": true
    },
    "max-chunks": {
      "chunk-radius": 4,
      "trigger-chunk-collect": true
    },
    "world-caches": {
      "disable-chunk-cache": true,
      "low-memory-trigger": true
    }
  },
  "network": {
    "batch-threshold": 256,
    "compression-level": 6,
    "async-compression": false,
    "upnp-forwarding": false,
    "max-mtu-size": 1492,
    "enable-encryption": true
  },
  "debug": {
    "level": 1
  },
  "player": {
    "save-player-data": true,
    "verify-xuid": true
  },
  "level-settings": {
    "default-format": "leveldb"
  },
  "chunk-sending": {
    "per-tick": 4,
    "spawn-radius": 4
  },
  "chunk-ticking": {
    "per-tick": 40,
    "tick-radius": 3,
    "blocks-per-subchunk-per-tick": 3,
    "disable-block-ticking": null
  },
  "chunk-generation": {
    "population-queue-size": 32
  },
  "ticks-per": {
    "autosave": 6000
  },
  "auto-report": {
    "enabled": true,
    "send-code": true,
    "send-settings": true,
    "send-phpinfo": false,
    "use-https": true,
    "host": "crash.pmmp.io"
  },
  "anonymous-statistics": {
    "enabled": false,
    "host": "stats.pocketmine.net"
  },
  "auto-updater": {
    "enabled": true,
    "on-update": {
      "warn-console": true
    },
    "preferred-channel": "stable",
    "suggest-channels": true,
    "host": "update.pmmp.io"
  },
  "timings": {
    "host": "timings.pmmp.io"
  },
  "console": {
    "title-tick": true
  },
  "aliases": null,
  "worlds": null,
  "plugins": {
    "legacy-data-dir": false
  }
}
*/