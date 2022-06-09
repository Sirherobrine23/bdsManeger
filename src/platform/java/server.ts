import path from "node:path";
import fs from "node:fs";
import crypto from "crypto";
import node_cron from "cron";
import * as child_process from "../../lib/childProcess";
import { backupRoot, serverRoot } from "../../pathControl";
import { BdsSession, bdsSessionCommands } from '../../globalType';
import { createZipBackup } from "../../backup/zip";
import events from "../../lib/customEvents";

const javaSesions: {[key: string]: BdsSession} = {};
export function getSessions() {return javaSesions;}

const ServerPath = path.join(serverRoot, "java");
export async function startServer(): Promise<BdsSession> {
  const SessionID = crypto.randomUUID();
  // Start Server
  const serverEvents = new events();
  const StartDate = new Date();
  const ServerProcess = await child_process.execServer({runOn: "host"}, "java", ["-jar", "Server.jar"], {cwd: ServerPath});
  // Log Server redirect to callbacks events and exit
  ServerProcess.on("out", data => serverEvents.emit("log_stdout", data));
  ServerProcess.on("err", data => serverEvents.emit("log_stderr", data));
  ServerProcess.on("all", data => serverEvents.emit("log", data));
  ServerProcess.Exec.on("exit", code => {
    serverEvents.emit("closed", code);
    if (code === null) serverEvents.emit("err", new Error("Server exited with code null"));
  });

  // Detect server start
  serverEvents.on("log", lineData => {
    // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
    if (/\[.*\].*\s+Done\s+\(.*\)\!.*/.test(lineData)) serverEvents.emit("started", new Date());
  });
  // Parse ports
  serverEvents.on("log", data => {
    const portParse = data.match(/Starting\s+Minecraft\s+server\s+on\s+(.*)\:(\d+)/);
    if (!!portParse) serverEvents.emit("port_listen", {port: parseInt(portParse[2]), protocol: "TCP", version: "IPv4/IPv6",});
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

  const backupCron = (crontime: string|Date, option?: {type: "zip", config?: {pathZip?: string}}): node_cron.CronJob => {
    // Validate Config
    if (option) {
      if (option.type === "zip") {}
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
      if (option.type === "zip") {
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
  logStream.write(`[${StartDate.toString()}] Server started\n\n`);
  ServerProcess.Exec.stdout.pipe(logStream);
  ServerProcess.Exec.stderr.pipe(logStream);

  // Session Object
  const Seesion: BdsSession = {
    id: SessionID,
    creteBackup: backupCron,
    ports: [],
    Player: {},
    seed: undefined,
    commands: serverCommands,
    server: {
      on: (act, fn) => serverEvents.on(act, fn),
      once: (act, fn) => serverEvents.once(act, fn),
      started: false,
      startDate: StartDate
    }
  };

  // Server Events
  serverEvents.on("port_listen", port => Seesion.ports.push(port));
  serverEvents.on("started", StartDate => {Seesion.server.started = true; Seesion.server.startDate = StartDate;});

  // Return Session
  javaSesions[SessionID] = Seesion;
  serverEvents.on("closed", () => delete javaSesions[SessionID]);
  return Seesion;
}