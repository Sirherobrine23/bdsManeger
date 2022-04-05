import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import * as child_process from "./childProcess";
import node_cron from "cron";
import addon from "./addons/index";
import * as bdsBackup from "./backup";
import { parseConfig as serverConfigParse } from "./serverConfig";
import * as bdsTypes from "./globalType";

type bdsSessionCommands = {
  /** Exec any commands in server */
  execCommand: (...command: Array<string|number>) => bdsSessionCommands;
  /** Teleport player to Destination */
  tpPlayer: (player: string, x: number, y: number, z: number) => bdsSessionCommands;
  worldGamemode: (gamemode: "survival"|"creative"|"hardcore") => bdsSessionCommands;
  userGamemode: (player: string, gamemode: "survival"|"creative"|"hardcore") => bdsSessionCommands;
};

type BdsSession = {
  /** Server Session ID */
  id: string;
  /** Server Started date */
  startDate: Date;
  /** if exists server map get world seed, fist map not get seed */
  seed?: string;
  /** Some platforms may have a plugin manager. */
  addonManeger?: {
    installAddon: (packPath: string) => Promise<void>;
    installAllAddons: (removeOldPacks: boolean) => Promise<void>;
  };
  /** register cron job to create backups */
  creteBackup: (crontime: string|Date) => node_cron.CronJob;
  /** Stop Server */
  stop: () => Promise<number|null>
  /** callback to log event */
  logRegister: (from: "all"|"stdout"|"stderr", callback: (data: string) => void) => string;
  /** If the server crashes or crashes, the callbacks will be called. */
  onExit: (callback: (code: number, signal: string) => void) => void;
  /** Get server players historic connections */
  getPlayer: () => {[player: string]: {action: "connect"|"disconnect"|"unknown"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"; date: Date}>}};
  /** This is a callback that call a function, for some player functions */
  onPlayer: (callback: (data: {player: string; action?: "connect"|"disconnect"|"unknown"; date: Date;}) => string) => void;
  /** Get Server ports. listening. */
  ports: () => Array<{port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}>;
  /** Basic server functions. */
  commands: bdsSessionCommands;
};

// Server Sessions
const Sessions: {[Session: string]: BdsSession} = {};
export function getSessions() {return Sessions;}

type portAction = {
  type: "port";
  data: {
    port: number;
    protocol?: "UDP"|"TCP";
    version?: "IPv4"|"IPv6"|"IPv4/IPv6"
  }
};
type playerConnect = {
  player: string;
  action: "connect"|"disconnect"|"unknown";
  date: Date;
  xuid?: string;
};
async function parserServerActions(Platform: bdsTypes.Platform, data: string, callbacks: (data: portAction|{type: "playerConnect", data: playerConnect}) => void) {
  if (Platform === "bedrock") {
    (() => {
      const portParse = data.match(/(IPv[46])\s+supported,\s+port:\s+(.*)/);
      if (!!portParse) {
        return callbacks({
          type: "port",
          data: {
            port: parseInt(portParse[2]),
            version: portParse[1] as "IPv4"|"IPv6"|"IPv4/IPv6",
            protocol: "UDP",
          }
        });
      }
    })();
    (() => {
      if (/r\s+.*\:\s+.*\,\s+xuid\:\s+.*/gi.test(data)) {
        const actionDate = new Date();
        const [action, player, xuid] = (data.match(/r\s+(.*)\:\s+(.*)\,\s+xuid\:\s+(.*)/)||[]).slice(1, 4);
        const __PlayerAction: {player: string, xuid: string|undefined, action: "connect"|"disconnect"|"unknown"} = {
          player: player,
          xuid: xuid,
          action: "unknown"
        };
        if (action === "connected") __PlayerAction.action = "connect";
        else if (action === "disconnected") __PlayerAction.action = "disconnect";
        return callbacks({
          type: "playerConnect",
          data: {
            player: __PlayerAction.player,
            action: __PlayerAction.action,
            date: actionDate,
            xuid: __PlayerAction.xuid||undefined
          }
        });
      }
    })();
  } else if (Platform === "java") {
    // Starting Minecraft server on *:25565
    (() => {
      const portParse = data.match(/Starting\s+Minecraft\s+server\s+on\s+(.*)\:(\d+)/);
      if (!!portParse) {
        return callbacks({
          type: "port",
          data: {
            port: parseInt(portParse[2]),
            version: "IPv4/IPv6",
            protocol: "TCP"
          }
        });
      }
    })();
  }
}

// Start Server
export async function Start(Platform: bdsTypes.Platform): Promise<BdsSession> {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), Platform);
  if (!(fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
  const Process: {command: string; args: Array<string>; env: {[env: string]: string};} = {
    command: "",
    args: [],
    env: {}
  };
  if (Platform === "bedrock") {
    if (process.platform === "darwin") throw new Error("Run Docker image");
    Process.command = path.resolve(ServerPath, "bedrock_server"+(process.platform === "win32"?".exe":""));
    if (process.platform !== "win32") {
      await child_process.runAsync("chmod", ["a+x", Process.command]);
      Process.env.LD_LIBRARY_PATH = path.resolve(ServerPath, "bedrock");
      if (process.arch !== "x64") {
        console.warn("Minecraft bedrock start with emulated x64 architecture");
        Process.args.push(Process.command);
        Process.command = "qemu-x86_64-static";
      }
    }
  } else if (Platform === "java"||Platform === "spigot") {
    Process.command = "java";
    Process.args.push("-jar");
    if (Platform === "java") Process.args.push(path.resolve(ServerPath, "Server.jar"));
    else Process.args.push(path.resolve(ServerPath, "Spigot.jar"));
  } else if (Platform === "pocketmine") {
    if (process.platform === "win32") Process.command = path.resolve(ServerPath, "php/php");
    else Process.command = path.resolve(ServerPath, "php7/bin/php");
    Process.args.push(path.resolve(ServerPath, "PocketMine-MP.phar"));
  }

  // Start Server
  const ServerProcess = await child_process.execServer({runOn: "host"}, Process.command, Process.args, {env: Process.env, cwd: ServerPath});
  const StartDate = new Date();

  // Log callback
  const logCallbaks: {[id: string]: {callback: (data: string) => void, to: "all"|"stdout"|"stderr"}} = {};
  const onLog = (from: "all"|"stdout"|"stderr", callback: (data: string) => void) => {
    const CallbackUUID = crypto.randomUUID();
    if (from === "all") logCallbaks[CallbackUUID] = {callback: callback, to: "all"};
    else if (from === "stderr") logCallbaks[CallbackUUID] = {callback: callback, to: "stderr"};
    else if (from === "stdout") logCallbaks[CallbackUUID] = {callback: callback, to: "stdout"};
    else throw new Error("Unknown log from");
    return CallbackUUID;
  };
  
  // Storage tmp lines
  const tempLog = {out: "", err: ""};
  const parseLog = (to: "out"|"err", data: string) => {
    tempLog[to] += data;
    if (/\n$/gi.test(tempLog[to])) {
      const localCall = tempLog[to];
      tempLog[to] = "";
      const filtedLog = localCall.replace(/\r\n/gi, "\n").replace(/\n$/gi, "").split(/\n/gi).filter(a => a !== undefined);
      Object.keys(logCallbaks).map(a => logCallbaks[a]).filter(a => a.to === "all"||a.to === "stdout").forEach(a => filtedLog.forEach(data => a.callback(data)));
    }
    return;
  }
  ServerProcess.stdout.on("data", data => parseLog("out", String(data)));
  ServerProcess.stderr.on("data", data => parseLog("err", String(data)));

  const playersConnections: {
    [player: string]: {
      action: "connect"|"disconnect"|"unknown";
      date: Date;
      history: Array<{
        action: "connect"|"disconnect"|"unknown";
        date: Date
      }>
    }
  } = {};
  const ports: Array<{
    port: number;
    protocol?: "TCP"|"UDP";
    version?: "IPv4"|"IPv6"|"IPv4/IPv6";
  }> = [];
  
  onLog("all", data => parserServerActions(Platform, data, actions => {
    if (actions.type === "port") {
      if (ports.find(a => a.port === actions.data.port)) return;
      ports.push(actions.data);
    } else if (actions.type === "playerConnect") {
      if (playersConnections[actions.data.player]) {
        playersConnections[actions.data.player].history.push({
          action: actions.data.action,
          date: actions.data.date
        });
      } else {
        playersConnections[actions.data.player] = {
          action: actions.data.action,
          date: actions.data.date,
          history: [{
            action: actions.data.action,
            date: actions.data.date
          }]
        };
      }
    }
  }));

  const playerCallbacks: {[id: string]: {callback: (data: playerConnect) => void}} = {};
  const onPlayer = (callback: (data: playerConnect) => void) => {
    const uid = crypto.randomUUID();
    playerCallbacks[uid] = {callback: callback};
    return uid;
  };
  onLog("all", data => parserServerActions(Platform, data, actions => {
    if (actions.type === "playerConnect") Object.keys(playerCallbacks).map(a => playerCallbacks[a]).forEach(a => a.callback(actions.data));
  }));

  // Exit callback
  const onExit = (callback: (code: number, signal: string) => void): void => {
    ServerProcess.on("exit", callback);
  }

  // Run Command
  const serverCommands: bdsSessionCommands = {
    /**
     * Run any commands in server.
     * @param command - Run any commands in server without parse commands
     * @returns - Server commands
     */
    execCommand: (...command) => {
      ServerProcess.stdin.write(command.map(a => String(a)).join(" ")+"\n");
      return serverCommands;
    },
    tpPlayer: (player: string, x: number, y: number, z: number) => {
      serverCommands.execCommand("tp", player, x, y, z);
      return serverCommands;
    },
    worldGamemode: (gamemode: "survival"|"creative"|"hardcore") => {
      if (Platform === "bedrock"||Platform === "java"||Platform === "spigot"||Platform === "pocketmine") serverCommands.execCommand("gamemode", gamemode);
      return serverCommands;
    },
    userGamemode: (player: string, gamemode: "survival"|"creative"|"hardcore") => {
      if (Platform === "bedrock"||Platform === "java"||Platform === "spigot"||Platform === "pocketmine") serverCommands.execCommand("gamemode", gamemode);
      return serverCommands;
    }
  }

  // Stop Server
  const stopServer: () => Promise<number|null> = () => {
    if (ServerProcess.exitCode !== null||ServerProcess.killed) return Promise.resolve(ServerProcess.exitCode);
    if (Platform === "bedrock") serverCommands.execCommand("stop");
    else if (Platform === "java"||Platform === "spigot") serverCommands.execCommand("stop");
    else if (Platform === "pocketmine") serverCommands.execCommand("stop");
    else ServerProcess.kill();
    return new Promise((accept, reject) => {
      ServerProcess.on("exit", code => (code === 0||code === null) ? accept(code) : reject(code));
      setTimeout(() => accept(null), 2000);
    })
  }

  // Return Session
  const Seesion: BdsSession = {
    id: crypto.randomUUID(),
    startDate: StartDate,
    seed: undefined,
    addonManeger: undefined,
    creteBackup: (crontime: string|Date) => {
      const cronJob = new node_cron.CronJob(crontime, async () => {
        if (Platform === "bedrock") {
          serverCommands.execCommand("save hold");
          serverCommands.execCommand("save query");
        }
        await bdsBackup.CreateBackup(Platform);
        if (Platform === "bedrock") serverCommands.execCommand("save resume");
      });
      ServerProcess.on("exit", () => cronJob.stop());
      cronJob.start();
      return cronJob;
    },
    logRegister: onLog,
    onExit: onExit,
    ports: () => ports,
    getPlayer: () => playersConnections,
    onPlayer: onPlayer,
    stop: stopServer,
    commands: serverCommands
  };
  if (Platform === "bedrock") {
    Seesion.addonManeger = addon.bedrock.addonInstaller();
    const bedrockConfig = await serverConfigParse(Platform);
    if (bedrockConfig.nbt) Seesion.seed = bedrockConfig.nbt.parsed.value.RandomSeed.value.toString();
  }
  const logFile = path.resolve(process.env.LOG_PATH||path.resolve(ServerPath, "../log"), `${Platform}_${Seesion.id}.log`);
  if(!(fs.existsSync(path.parse(logFile).dir))) fs.mkdirSync(path.parse(logFile).dir, {recursive: true});
  const logStream = fs.createWriteStream(logFile, {flags: "w+"});
  logStream.write(`[${StartDate.toISOString()}] Server started\n\n`);
  ServerProcess.stdout.pipe(logStream);
  ServerProcess.stderr.pipe(logStream);
  Sessions[Seesion.id] = Seesion;
  ServerProcess.on("exit", () => {delete Sessions[Seesion.id];});
  return Seesion;
}
