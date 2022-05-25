import path from "node:path";
import fs from "node:fs";
import events from "events";
import crypto from "crypto";
import node_cron from "cron";
import * as child_process from "../../childProcess";
import { backupRoot, serverRoot } from "../../pathControl";
import { BdsSession, bdsSessionCommands } from "../../globalType";
import { gitBackup, gitBackupOption } from "../../backup/git";
import { createZipBackup } from "../../backup/zip";

const pocketmineSesions: {[key: string]: BdsSession} = {};
export function getSessions() {return pocketmineSesions;}

export function parseUserAction(data: string): {player: string; action: "connect"|"disconnect"|"unknown"; date: Date; xuid?: string;}|void {
  if (/\[.*\]:\s+(.*)\s+(.*)\s+the\s+game/gi.test(data)) {
    const actionDate = new Date();
    const [action, player] = (data.match(/[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi)||[]).slice(1, 3);
    const __PlayerAction: {player: string, action: "connect"|"disconnect"|"unknown"} = {
      player: player,
      action: "unknown"
    };
    if (action === "joined") __PlayerAction.action = "connect";
    else if (action === "left") __PlayerAction.action = "disconnect";
    return {
      player: __PlayerAction.player,
      action: __PlayerAction.action,
      date: actionDate
    };
  }
  return;
}

const ServerPath = path.join(serverRoot, "pocketmine");
export async function startServer(): Promise<BdsSession> {
  const SessionID = crypto.randomUUID();
  const Process: {command: string; args: Array<string>; env: {[env: string]: string};} = {
    command: "",
    args: [],
    env: {...process.env}
  };
  Process.args.push(path.join(ServerPath, "PocketMine.phar"));
  if (process.platform === "win32") Process.command = path.resolve(ServerPath, "bin/php/php.exe");
  else {
    Process.command = path.resolve(ServerPath, "bin/bin/php");
    await child_process.runAsync("chmod", ["a+x", Process.command]);
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
    // [16:49:31.284] [Server thread/INFO]: Minecraft network interface running on [::]:19133
    // [16:49:31.273] [Server thread/INFO]: Minecraft network interface running on 0.0.0.0:19132
    if (/\[.*\]:\s+Minecraft\s+network\s+interface\s+running\s+on\s+(.*)/gi.test(data)) {
      const portParse = data.match(/\[.*\]:\s+Minecraft\s+network\s+interface\s+running\s+on\s+(.*)/)[1];
      if (!!portParse) {
        if (/\[.*\]/.test(portParse)) {
          ports.push({
            port: parseInt(portParse.match(/\[.*\]:\s+(.*)/)[1]),
            version: "IPv6"
          });
        } else {
          ports.push({
            port: parseInt(portParse.split(":")[1]),
            version: "IPv4"
          });
        }
      }
    }
  });
  // Player
  onLog.on("all", data => {
    if (/\[.*\]:\s+(.*)\s+(.*)\s+the\s+game/gi.test(data)) {
      const actionDate = new Date();
      const [action, player] = (data.match(/[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi)||[]).slice(1, 3);
      const __PlayerAction: {player: string, action: "connect"|"disconnect"|"unknown"} = {
        player: player,
        action: "unknown"
      };
      if (action === "joined") __PlayerAction.action = "connect";
      else if (action === "left") __PlayerAction.action = "disconnect";
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
    // [22:52:05.580] [Server thread/INFO]: Done (0.583s)! For help, type "help" or "?"
    if (/\[.*\].*\s+Done\s+\(.*\)\!.*/.test(lineData)) {
      Seesion.started = true;
      serverEvents.emit("started", new Date());
    }
  });

  // Return Session
  pocketmineSesions[SessionID] = Seesion;
  onExit().catch(() => null).then(() => delete pocketmineSesions[SessionID]);
  return Seesion;
}