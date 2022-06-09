import path from "node:path";
import fs from "node:fs";
import crypto from "crypto";
import node_cron from "cron";
import * as child_process from "../../childProcess";
import { backupRoot, serverRoot } from "../../pathControl";
import { BdsSession, bdsSessionCommands, playerAction2 } from '../../globalType';
import { getConfig } from "./config";
import { gitBackup, gitBackupOption } from "../../backup/git";
import { createZipBackup } from "../../backup/zip";
import events from "../../lib/customEvents";
import portislisten from "../../lib/portIsAllocated";

const bedrockSesions: {[key: string]: BdsSession} = {};
export function getSessions() {return bedrockSesions;}

const ServerPath = path.join(serverRoot, "bedrock");
export async function startServer(): Promise<BdsSession> {
  if (!(fs.existsSync(ServerPath))) throw new Error("Install server first");
  const SessionID = crypto.randomUUID();
  const serverConfig = await getConfig();
  if (await portislisten(serverConfig.port.v4)) throw new Error("Port is already in use");
  if (await portislisten(serverConfig.port.v6)) throw new Error("Port is already in use");
  const Process: {command: string; args: Array<string>; env: {[env: string]: string};} = {command: "", args: [], env: {...process.env}};
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
  const serverEvents = new events({captureRejections: false});
  serverEvents.setMaxListeners(0);
  const ServerProcess = await child_process.execServer({runOn: "host"}, Process.command, Process.args, {env: Process.env, cwd: ServerPath});
  // Log Server redirect to callbacks events and exit
  ServerProcess.on("out", data => serverEvents.emit("log_stdout", data));
  ServerProcess.on("err", data => serverEvents.emit("log_stderr", data));
  ServerProcess.on("all", data => serverEvents.emit("log", data));
  ServerProcess.Exec.on("exit", code => {
    serverEvents.emit("closed", code);
    if (code === null) serverEvents.emit("err", new Error("Server exited with code null"));
  });

  // on start
  serverEvents.on("log", lineData => {
    // [2022-05-19 22:35:09:315 INFO] Server started.
    if (/\[.*\]\s+Server\s+started\./.test(lineData)) serverEvents.emit("started", new Date());
  });

  // Port
  serverEvents.on("log", data => {
    const portParse = data.match(/(IPv[46])\s+supported,\s+port:\s+(.*)/);
    if (!!portParse) serverEvents.emit("port_listen", {port: parseInt(portParse[2]), protocol: "UDP", version: portParse[1] as "IPv4"|"IPv6"});
  });

  // Player
  serverEvents.on("log", data => {
    if (/r\s+.*\:\s+.*\,\s+xuid\:\s+.*/gi.test(data)) {
      const actionDate = new Date();
      const [action, player, xuid] = (data.match(/r\s+(.*)\:\s+(.*)\,\s+xuid\:\s+(.*)/)||[]).slice(1, 4);
      const playerAction: playerAction2 = {player: player, xuid: xuid, action: "unknown", Date: actionDate};
      if (action === "connected") playerAction.action = "connect";
      else if (action === "disconnected") playerAction.action = "disconnect";

      // Server player event
      serverEvents.emit("player", playerAction);
      delete playerAction.action;
      if (action === "connect") serverEvents.emit("player_connect", playerAction);
      else if (action === "disconnect") serverEvents.emit("player_disconnect", playerAction);
      else serverEvents.emit("player_unknown", playerAction);
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
    serverEvents.on("closed", () => CrontimeBackup.stop());
    return CrontimeBackup;
  }

  // Session log
  const logFile = path.resolve(process.env.LOG_PATH||path.resolve(ServerPath, "../log"), `bedrock_${SessionID}.log`);
  if(!(fs.existsSync(path.parse(logFile).dir))) fs.mkdirSync(path.parse(logFile).dir, {recursive: true});
  const logStream = fs.createWriteStream(logFile, {flags: "w+"});
  logStream.write(`[${(new Date()).toString()}] Server started\n\n`);
  ServerProcess.Exec.stdout.pipe(logStream);
  ServerProcess.Exec.stderr.pipe(logStream);

  // Session Object
  const Seesion: BdsSession = {
    id: SessionID,
    logFile: logFile,
    creteBackup: backupCron,
    seed: serverConfig.worldSeed,
    ports: [],
    Player: {},
    commands: serverCommands,
    server: {
      on: (act, fn) => serverEvents.on(act, fn),
      once: (act, fn) => serverEvents.once(act, fn),
      started: false,
      startDate: new Date(),
    }
  };

  serverEvents.on("port_listen", Seesion.ports.push);
  serverEvents.on("started", date => {Seesion.server.started = true; Seesion.server.startDate = date;});
  serverEvents.on("player", playerAction => {
    // Add to object
    const playerExist = !!Seesion.Player[playerAction.player];
    if (playerExist) {
      Seesion.Player[playerAction.player].action = playerAction.action;
      Seesion.Player[playerAction.player].date = playerAction.Date;
      Seesion.Player[playerAction.player].history.push({
        action: playerAction.action,
        date: playerAction.Date
      });
    } else Seesion.Player[playerAction.player] = {
      action: playerAction.action,
      date: playerAction.Date,
      history: [{
        action: playerAction.action,
        date: playerAction.Date
      }]
    };
  });

  // Return Session
  bedrockSesions[SessionID] = Seesion;
  serverEvents.on("closed", () => delete bedrockSesions[SessionID]);
  return Seesion;
}