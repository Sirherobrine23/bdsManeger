import path from "node:path";
import fs from "node:fs";
import events from "events";
import crypto from "crypto";
import node_cron from "cron";
import * as child_process from "../../childProcess";
import { backupRoot, serverRoot } from "../../pathControl";
import { BdsSession, bdsSessionCommands } from "../../server";
import { getConfig } from "./config";
import { gitBackup, gitBackupOption } from "../../backup/git";
import { createZipBackup } from "../../backup/zip";

const bedrockSesions: {[key: string]: BdsSession} = {};
export function getSessions() {return bedrockSesions;}

const ServerPath = path.join(serverRoot, "bedrock");
export async function startServer(): Promise<BdsSession> {
  const SessionID = crypto.randomUUID();
  const Process: {command: string; args: Array<string>; env: {[env: string]: string};} = {
    command: "",
    args: [],
    env: {...process.env}
  };
  if (process.platform === "darwin") throw new Error("Run Docker image");
    Process.command = path.resolve(ServerPath, "bedrock_server"+(process.platform === "win32"?".exe":""));
    if (process.platform !== "win32") {
      await child_process.runAsync("chmod", ["a+x", Process.command]);
      Process.env.LD_LIBRARY_PATH = path.resolve(ServerPath, "bedrock");
      if (process.platform === "linux" && process.arch !== "x64") {
      const existQemu = await child_process.runCommandAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false);
      if (existQemu) {
        console.warn("Minecraft bedrock start with emulated x64 architecture");
        Process.args.push(Process.command);
        Process.command = "qemu-x86_64-static";
      }
    }
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

  // Port
  onLog.on("all", data => {
    const portParse = data.match(/(IPv[46])\s+supported,\s+port:\s+(.*)/);
    if (!!portParse) {
      ports.push({
        port: parseInt(portParse[2]),
        version: portParse[1] as "IPv4"|"IPv6",
        protocol: "UDP"
      });
    }
  });
  // Player
  onLog.on("all", data => {
    if (/r\s+.*\:\s+.*\,\s+xuid\:\s+.*/gi.test(data)) {
      const actionDate = new Date();
      const [action, player, xuid] = (data.match(/r\s+(.*)\:\s+(.*)\,\s+xuid\:\s+(.*)/)||[]).slice(1, 4);
      const __PlayerAction: {player: string, xuid: string|undefined, action: "connect"|"disconnect"|"unknown"} = {
        player: player,
        xuid: xuid,
        action: "unknown"
      };
      if (action === "connected") __PlayerAction.action = "connect"; else if (action === "disconnected") __PlayerAction.action = "disconnect";
      if (!playersConnections[__PlayerAction.player]) playersConnections[__PlayerAction.player] = {
        action: __PlayerAction.action,
        date: actionDate,
        history: [{
          action: __PlayerAction.action,
          date: actionDate
        }]
      }; else {
        playersConnections[__PlayerAction.player].action = __PlayerAction.action;
        playersConnections[__PlayerAction.player].date = actionDate;
        playersConnections[__PlayerAction.player].history.push({
          action: __PlayerAction.action,
          date: actionDate
        });
      }
    }
  });

  // Run Command
  const serverCommands: bdsSessionCommands = {
    /**
     * Run any commands in server.
     * @param command - Run any commands in server without parse commands
     * @returns - Server commands
     */
    execCommand: (...command) => {
      ServerProcess.writelf(command.map(a => String(a)).join(" "));
      return serverCommands;
    },
    tpPlayer: (player: string, x: number, y: number, z: number) => {
      serverCommands.execCommand("tp", player, x, y, z);
      return serverCommands;
    },
    worldGamemode: (gamemode: "survival"|"creative"|"hardcore") => {
      serverCommands.execCommand("gamemode", gamemode);
      return serverCommands;
    },
    userGamemode: (player: string, gamemode: "survival"|"creative"|"hardcore") => {
      serverCommands.execCommand("gamemode", gamemode, player);
      return serverCommands;
    },
    stop: (): Promise<number|null> => {
      if (ServerProcess.Exec.exitCode !== null||ServerProcess.Exec.killed) return Promise.resolve(ServerProcess.Exec.exitCode);
      if (ServerProcess.Exec.killed) return Promise.resolve(ServerProcess.Exec.exitCode);
      ServerProcess.writelf("stop");
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
      serverCommands.execCommand("save hold");
      await new Promise(accept => setTimeout(accept, 1000));
      serverCommands.execCommand("save query");
      await new Promise(accept => setTimeout(accept, 1000));
    }
    async function unLockServerBackup() {
      serverCommands.execCommand("save resume");
      await new Promise(accept => setTimeout(accept, 1000));
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
  const logFile = path.resolve(process.env.LOG_PATH||path.resolve(ServerPath, "../log"), `bedrock_${SessionID}.log`);
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
    // [2022-05-19 22:35:09:315 INFO] Server started.
    if (/\[.*\]\s+Server\s+started\./.test(lineData)) {
      Seesion.started = true;
      serverEvents.emit("started", new Date());
    }
  });
  Seesion.seed = (await getConfig()).worldSeed;

  // Return Session
  bedrockSesions[SessionID] = Seesion;
  onExit().catch(() => null).then(() => delete bedrockSesions[SessionID]);
  return Seesion;
}