import path from "path";
import fs from "fs";
import os from "os";
import events from "events";
import crypto from "crypto";
import node_cron from "cron";
import * as platformManeger from "./platform";
import * as child_process from "./childProcess";
import * as bdsBackup from "./backup";
import { parseConfig as serverConfigParse } from "./serverConfig";
import * as worldManeger from "./worldManeger";
import * as bdsTypes from "./globalType";

type bdsSessionCommands = {
  /** Exec any commands in server */
  execCommand: (...command: Array<string|number>) => bdsSessionCommands;
  /** Teleport player to Destination */
  tpPlayer: (player: string, x: number, y: number, z: number) => bdsSessionCommands;
  /** Change world gamemode */
  worldGamemode: (gamemode: "survival"|"creative"|"hardcore") => bdsSessionCommands;
  /** Change gamemode to specified player */
  userGamemode: (player: string, gamemode: "survival"|"creative"|"hardcore") => bdsSessionCommands;
  /** Stop Server */
  stop: () => Promise<number|null>;
};

// Server Sessions
const Sessions: {[Session: string]: BdsSession} = {};
export function getSessions() {return Sessions;}

type startServerOptions = {
  /** Save only worlds/maps without server software - (Beta) */
  storageOnlyWorlds?: boolean;
  gitBackup?: bdsBackup.gitBackupOption;
};

export type BdsSession = {
  /** Server Session ID */
  id: string;
  /** Server Started date */
  startDate: Date;
  /** if exists server map get world seed, fist map not get seed */
  seed?: string|number;
  /** Server Started */
  started: boolean;
  /** Some platforms may have a plugin manager. */
  addonManeger?: any;
  /** register cron job to create backups */
  creteBackup: (crontime: string|Date, option?: {type: "git"; config: bdsBackup.gitBackupOption}|{type: "zip"}) => node_cron.CronJob;
  /** callback to log event */
  log: {
    on: (eventName: "all"|"err"|"out", listener: (data: string) => void) => void;
    once: (eventName: "all"|"err"|"out", listener: (data: string) => void) => void;
  };
  /** If the server crashes or crashes, the callbacks will be called. */
  onExit: (callback: (code: number) => void) => void;
  /** Server actions, example on avaible to connect or banned¹ */
  server: {
    /** Server actions, example on avaible to connect or banned¹ */
    on: (act: "started"|"ban", call: (...any) => void) => void;
    /** Server actions, example on avaible to connect or banned¹ */
    once: (act: "started"|"ban", call: (...any) => void) => void;
  };
  /** Get server players historic connections */
  getPlayer: () => {[player: string]: {action: "connect"|"disconnect"|"unknown"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"; date: Date}>}};
  /** This is a callback that call a function, for some player functions */
  onPlayer: (callback: (data: {player: string; action?: "connect"|"disconnect"|"unknown"; date: Date;}) => string) => void;
  /** Get Server ports. listening. */
  ports: () => Array<{port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}>;
  /** Basic server functions. */
  commands: bdsSessionCommands;
};

// Start Server
export default Start;
export async function Start(Platform: bdsTypes.Platform, options?: startServerOptions): Promise<BdsSession> {
  const SessionID = crypto.randomUUID();
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), Platform);
  if (!(fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
  const Process: {command: string; args: Array<string>; env: {[env: string]: string};} = {
    command: "",
    args: [],
    env: {}
  };
  if (Platform === "bedrock") {
    const BedrockPro = await platformManeger.bedrock.server.startServer();
    Process.command = BedrockPro.command;
    Process.args = BedrockPro.args;
    Process.env = BedrockPro.env;
  } else if (Platform === "pocketmine") {
    if (process.platform === "win32") Process.command = path.resolve(ServerPath, "bin/php/php.exe");
    else {
      Process.command = path.resolve(ServerPath, "bin/bin/php");
      await child_process.runAsync("chmod", ["a+x", Process.command]);
    }
    Process.args.push(path.join(ServerPath, "PocketMine.phar"));
  } else if (Platform === "java"||Platform === "spigot") {
    Process.command = "java";
    Process.args.push("-jar");
    if (Platform === "java") Process.args.push(path.resolve(ServerPath, "Server.jar"));
    else Process.args.push(path.resolve(ServerPath, "Spigot.jar"));
  }

  if (options?.storageOnlyWorlds) {
    await worldManeger.storageWorld(Platform, ServerPath, (await serverConfigParse(Platform)).world);
  }

  // Start Server
  const serverEvents = new events();
  const StartDate = new Date();
  const ServerProcess = await child_process.execServer({runOn: "host"}, Process.command, Process.args, {env: Process.env, cwd: ServerPath});
  const { onExit } = ServerProcess;
  const onLog = {on: ServerProcess.on, once: ServerProcess.once};
  const playerCallbacks: {[id: string]: {callback: (data: {player: string; action: "connect"|"disconnect"|"unknown"; date: Date;}) => void}} = {};
  const onPlayer = (callback: (data: {player: string; action: "connect"|"disconnect"|"unknown"; date: Date;}) => void) => {
    const uid = crypto.randomUUID();
    playerCallbacks[uid] = {callback: callback};
    return uid;
  };

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
  const ports: Array<{port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6";}> = [];

  if (Platform === "bedrock") {
    // Port
    onLog.on("all", data => {
      const port = platformManeger.bedrock.server.parsePorts(data);
      if (!!port) ports.push({...port, protocol: "UDP"});
    });
    // Player
    onLog.on("all", data => {
      const player = platformManeger.bedrock.server.parseUserAction(data);
      if (!!player) {
        if (!playersConnections[player.player]) playersConnections[player.player] = {
          action: player.action,
          date: player.date,
          history: [{
            action: player.action,
            date: player.date
          }]
        }; else {
          playersConnections[player.player].action = player.action;
          playersConnections[player.player].date = player.date;
          playersConnections[player.player].history.push({
            action: player.action,
            date: player.date
          });
        }
      }
    })
  } else if (Platform === "pocketmine") {
    onLog.on("all", data => {
      const port = platformManeger.pocketmine.server.parsePorts(data);
      if (!!port) ports.push({...port, protocol: "UDP"});
    });
    onLog.on("all", data => {
      const player = platformManeger.pocketmine.server.parseUserAction(data);
      if (!!player) {
        if (!playersConnections[player.player]) playersConnections[player.player] = {
          action: player.action,
          date: player.date,
          history: [{
            action: player.action,
            date: player.date
          }]
        }; else {
          playersConnections[player.player].action = player.action;
          playersConnections[player.player].date = player.date;
          playersConnections[player.player].history.push({
            action: player.action,
            date: player.date
          });
        }
        Object.keys(playerCallbacks).forEach(a => playerCallbacks[a].callback(player));
      }
    });
  } else if (Platform === "java") {
    onLog.on("all", data => {
      const port = platformManeger.java.server.parsePorts(data);
      if (!!port) ports.push({...port, protocol: "TCP"});
    });
  }

  // Stop Server
  const stopServer: () => Promise<number|null> = () => {
    if (ServerProcess.Exec.exitCode !== null||ServerProcess.Exec.killed) return Promise.resolve(ServerProcess.Exec.exitCode);
    if (Platform === "bedrock"||Platform === "java"||Platform === "spigot"||Platform === "pocketmine") serverCommands.execCommand("stop");
    else ServerProcess.Exec.kill();
    if (ServerProcess.Exec.killed) return Promise.resolve(ServerProcess.Exec.exitCode);
    return new Promise((accept, reject) => {
      ServerProcess.onExit(code => (code === 0||code === null) ? accept(code) : reject(code));
      setTimeout(() => accept(null), 2000);
    })
  }

  // Run Command
  const serverCommands: bdsSessionCommands = {
    /**
     * Run any commands in server.
     * @param command - Run any commands in server without parse commands
     * @returns - Server commands
     */
    execCommand: (...command) => {
      ServerProcess.Exec.stdin.write(command.map(a => String(a)).join(" ")+"\n");
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
      if (Platform === "bedrock"||Platform === "java"||Platform === "spigot"||Platform === "pocketmine") serverCommands.execCommand("gamemode", gamemode, player);
      return serverCommands;
    },
    stop: stopServer
  }

  const backupCron = (crontime: string|Date, option?: {type: "git"; config: bdsBackup.gitBackupOption}|{type: "zip", config?: {pathZip?: string}}): node_cron.CronJob => {
    // Validate Config
    if (option) {
      if (option.type === "git") {
        if (!option.config) throw new Error("Config is required");
      } else if (option.type === "zip") {}
      else option = {type: "zip"};
    }
    async function lockServerBackup() {
      if (Platform === "bedrock") {
        serverCommands.execCommand("save hold");
        await new Promise(accept => setTimeout(accept, 1000));
        serverCommands.execCommand("save query");
        await new Promise(accept => setTimeout(accept, 1000));
      }
    }
    async function unLockServerBackup() {
      if (Platform === "bedrock") {
        serverCommands.execCommand("save resume");
        await new Promise(accept => setTimeout(accept, 1000));
      }
    }
    if (!option) option = {type: "zip"};
    const CrontimeBackup = new node_cron.CronJob(crontime, async () => {
      if (option.type === "git") {
        await lockServerBackup();
        await bdsBackup.gitBackup(option.config).catch(() => undefined).then(() => unLockServerBackup());
      } else if (option.type === "zip") {
        await lockServerBackup();
        if (!!option?.config?.pathZip) await bdsBackup.CreateBackup({path: path.resolve(bdsBackup.backupFolderPath, option?.config?.pathZip)}).catch(() => undefined);
        else await bdsBackup.CreateBackup(true).catch(() => undefined);
        await unLockServerBackup();
      }
    });
    CrontimeBackup.start();
    onExit(() => CrontimeBackup.stop());
    return CrontimeBackup;
  }

  // Session log
  const logFile = path.resolve(process.env.LOG_PATH||path.resolve(ServerPath, "../log"), `${Platform}_${SessionID}.log`);
  if(!(fs.existsSync(path.parse(logFile).dir))) fs.mkdirSync(path.parse(logFile).dir, {recursive: true});
  const logStream = fs.createWriteStream(logFile, {flags: "w+"});
  logStream.write(`[${StartDate.toString()}] Server started\n\n`);
  ServerProcess.Exec.stdout.pipe(logStream);
  ServerProcess.Exec.stderr.pipe(logStream);

  const serverOn = (act: "started" | "ban", call: (...any: any[]) => void) => serverEvents.on(act, call);
  const serverOnce = (act: "started" | "ban", call: (...any: any[]) => void) => serverEvents.once(act, call);

  // Session Object
  const Seesion: BdsSession = {
    id: SessionID,
    startDate: StartDate,
    creteBackup: backupCron,
    onExit: onExit,
    onPlayer: onPlayer,
    ports: () => ports,
    getPlayer: () => playersConnections,
    server: {
      on: serverOn,
      once: serverOnce
    },
    seed: undefined,
    started: false,
    addonManeger: undefined,
    log: onLog,
    commands: serverCommands,
  };

  onLog.on("all", lineData => {
    if (Platform === "bedrock") {
      // [2022-05-19 22:35:09:315 INFO] Server started.
      if (/\[.*\]\s+Server\s+started\./.test(lineData)) {
        Seesion.started = true;
        serverEvents.emit("started", new Date());
      }
    } else if (Platform === "java") {
      // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
      if (/\[.*\].*\s+Done\s+\(.*\)\!.*/.test(lineData)) {
        Seesion.started = true;
        serverEvents.emit("started", new Date());
      }
    } else if (Platform === "pocketmine") {
      // [22:52:05.580] [Server thread/INFO]: Done (0.583s)! For help, type "help" or "?"
      if (/\[.*\].*\s+Done\s+\(.*\)\!.*/.test(lineData)) {
        Seesion.started = true;
        serverEvents.emit("started", new Date());
      }
    }
  });
  if (Platform === "bedrock") {
    Seesion.seed = (await platformManeger.bedrock.config.getConfig()).worldSeed;
  }

  // Return Session
  Sessions[SessionID] = Seesion;
  onExit(() => delete Sessions[SessionID]);
  return Seesion;
}