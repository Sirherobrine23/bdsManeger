import path from "node:path";
import fs from "node:fs";
import events from "events";
import crypto from "crypto";
import node_cron from "cron";
import * as platformManeger from "./platform";
import * as child_process from "./childProcess";
import { parseConfig as serverConfigParse } from "./serverConfig";
import * as worldManeger from "./worldManeger";
import * as bdsTypes from "./globalType";
import { backupRoot, serverRoot } from "./pathControl";
import { gitBackup, gitBackupOption } from "./backup/git";
import { createZipBackup } from "./backup/zip";

// Server Sessions
const Sessions: {[Session: string]: bdsTypes.BdsSession} = {};
export function getSessions(): {[SessionID: string]: bdsTypes.BdsSession} {return {
  ...Sessions,
  ...(platformManeger.bedrock.server.getSessions()),
  ...(platformManeger.java.server.getSessions()),
};}

// Start Server
export default Start;
export async function Start(Platform: bdsTypes.Platform, options?: bdsTypes.startServerOptions): Promise<bdsTypes.BdsSession> {
  const SessionID = crypto.randomUUID();
  const ServerPath = path.join(serverRoot, Platform);
  if (!(fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
  const Process: {command: string; args: Array<string>; env: {[env: string]: string};} = {
    command: "",
    args: [],
    env: {}
  };
  if (Platform === "bedrock") return platformManeger.bedrock.server.startServer();
  else if (Platform === "java") return platformManeger.java.server.startServer();
  else if (Platform === "pocketmine") return platformManeger.pocketmine.server.startServer();
  else if (Platform === "spigot") {
    Process.command = "java";
    Process.args.push("-jar");
    Process.args.push(path.resolve(ServerPath, "Spigot.jar"));
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

  // Run Command
  const serverCommands: bdsTypes.bdsSessionCommands = {
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
      if (Platform === "spigot"||Platform === "pocketmine") serverCommands.execCommand("gamemode", gamemode);
      return serverCommands;
    },
    userGamemode: (player: string, gamemode: "survival"|"creative"|"hardcore") => {
      if (Platform === "spigot"||Platform === "pocketmine") serverCommands.execCommand("gamemode", gamemode, player);
      return serverCommands;
    },
    stop: (): Promise<number|null> => {
      if (ServerProcess.Exec.exitCode !== null||ServerProcess.Exec.killed) return Promise.resolve(ServerProcess.Exec.exitCode);
      if (Platform === "spigot"||Platform === "pocketmine") serverCommands.execCommand("stop");
      else ServerProcess.Exec.kill();
      if (ServerProcess.Exec.killed) return Promise.resolve(ServerProcess.Exec.exitCode);
      return ServerProcess.onExit();
    }
  }

  const backupCron = (crontime: string|Date, option?: {type: "git"; config: gitBackupOption}|{type: "zip", config?: {pathZip?: string}}): node_cron.CronJob => {
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
        await gitBackup(option.config).catch(() => undefined).then(() => unLockServerBackup());
      } else if (option.type === "zip") {
        await lockServerBackup();
        if (!!option?.config?.pathZip) await createZipBackup({path: path.resolve(backupRoot, option?.config?.pathZip)}).catch(() => undefined);
        else await createZipBackup(true).catch(() => undefined);
        await unLockServerBackup();
      }
    });
    CrontimeBackup.start();
    onExit().catch(() => null).then(() => CrontimeBackup.stop());
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
  const Seesion: bdsTypes.BdsSession = {
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

  // Return Session
  Sessions[SessionID] = Seesion;
  onExit().catch(() => null).then(() => delete Sessions[SessionID]);
  return Seesion;
}