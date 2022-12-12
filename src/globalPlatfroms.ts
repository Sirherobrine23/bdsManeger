import fs from "node:fs";
import readline from "node:readline";
import child_process from "node:child_process";
import { EventEmitter } from "node:events";
import { bdsPlatform } from "./platformPathManeger.js";
import debug from "debug";
export const internalSessions: {[sessionID: string]: serverActionV2} = {};
process.once("exit", () => Object.keys(internalSessions).forEach(id => internalSessions[id].stopServer()));
const actionsDebug = debug("bdscore:global_platform");

export type actionCommandOption = {command: string, args?: string[], options?: fs.ObjectEncodingOptions & child_process.ExecFileOptions & {logPath?: {stdout: string, stderr?: string}}};
export type playerHistoric = {[player: string]: {action: "connect"|"disconnect"|"unknown"|"spawn"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"|"spawn"; date: Date}>}};
export type playerBase = {
  playerName: string,
  connectTime: Date,
  xuid?: string,
  action?: string,
  lineString?: string
};
export type portListen = {port: number, host?: string, type: "TCP"|"UDP"|"TCP/UDP", protocol: "IPv4"|"IPv6"|"IPV4/IPv6"|"Unknown", proxyOrigin?: number, plugin?: string};
export type serverStarted = Date|{
  onAvaible: Date,
  timePassed: number
};

export declare interface serverActionsEvent {
  on(act: "error", fn: (data: any) => void): this;
  once(act: "error", fn: (data: any) => void): this;
  emit(act: "error", data: any): boolean;

  on(act: "playerConnect"|"playerDisconnect"|"playerUnknown"|"playerSpawn", fn: (data: playerBase) => void): this;
  once(act: "playerConnect"|"playerDisconnect"|"playerUnknown"|"playerSpawn", fn: (data: playerBase) => void): this;
  emit(act: "playerConnect"|"playerDisconnect"|"playerUnknown"|"playerSpawn", data: playerBase): boolean;

  on(act: "portListening", fn: (data: portListen) => void): this;
  once(act: "portListening", fn: (data: portListen) => void): this;
  emit(act: "portListening", data: portListen): boolean;

  on(act: "serverStarted", fn: (data: serverStarted) => void): this;
  once(act: "serverStarted", fn: (data: serverStarted) => void): this;
  emit(act: "serverStarted", data: serverStarted): boolean;

  on(act: "log_stderr", fn: (data: string) => void): this;
  once(act: "log_stderr", fn: (data: string) => void): this;
  emit(act: "log_stderr", data: string): boolean;

  on(act: "log_stdout", fn: (data: string) => void): this;
  once(act: "log_stdout", fn: (data: string) => void): this;
  emit(act: "log_stdout", data: string): boolean;

  on(act: "log", fn: (data: string) => void): this;
  once(act: "log", fn: (data: string) => void): this;
  emit(act: "log", data: string): boolean;

  on(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  once(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  emit(act: "exit", data: {code: number, signal: NodeJS.Signals}): boolean;
}
export class serverActionsEvent extends EventEmitter {};

export type playerCallback = {
  [T in playerHistoric[number]["action"]]: (player: playerBase) => void
};

export type actionsV2 = {
  serverStarted?: (data: string, done: (startedDate: serverStarted) => void) => void,
  portListening?: (data: string, done: (portInfo: portListen) => void) => void,
  playerAction?: (data: string, Callbacks: playerCallback) => void,
  stopServer?: (components: {child: child_process.ChildProcess, actions: serverActionV2}) => void|ReturnType<serverActionV2["stopServer"]>,
  playerTp?: (actions: serverActionV2, playerName: string, x: number|string, y: number|string, z: number|string) => void,
};

export type serverActionV2 = {
  version: 2,
  id: string,
  platform: bdsPlatform,
  events: serverActionsEvent,
  serverCommand?: actionCommandOption,
  serverStarted?: serverStarted,
  killProcess: (signal?: number|NodeJS.Signals) => boolean,
  waitExit: () => Promise<number|NodeJS.Signals>
  stopServer: () => ReturnType<serverActionV2["waitExit"]>,
  runCommand?: (...command: Array<string|number|boolean>) => serverActionV2,
  tp?: (playerName: string, x: number|string, y: number|string, z: number|string) => serverActionV2,
  portListening: {[port: number]: portListen},
  playerActions: playerHistoric,
};

/**
 * A second version for actions, this version fixes several issues that occur with the old class-based version.
 */
export async function actionV2(options: {id: string, platform: bdsPlatform, processConfig: actionCommandOption, hooks: actionsV2}) {
  if (internalSessions[options.id]) throw new Error("The platform with that id is already running!");
  // Add exec options if not exists
  const {processConfig} = options;
  if (!processConfig.args) processConfig.args = [];
  if (!processConfig.options) processConfig.options = {};
  // Disable log buffer limit
  processConfig.options.maxBuffer = Infinity;
  processConfig.options.env = {...process.env, ...(processConfig.options.env||{})}

  // Run commands
  actionsDebug("Stating %s", options.id);
  const childProcess = child_process.execFile(processConfig.command, processConfig.args, processConfig.options);
  const serverObject: serverActionV2 = {
    version: 2,
    id: options.id,
    platform: options.platform,
    events: new serverActionsEvent({captureRejections: false}),
    playerActions: {},
    portListening: {},
    serverCommand: processConfig,
    runCommand(...command: Array<string|number|boolean>) {
      const commandMaped = command.map(a => String(a)).join(" ")
      actionsDebug("%s run '%s'", options.id, commandMaped);
      childProcess.stdin.write(commandMaped+"\n");
      return serverObject;
    },
    killProcess(signal?: number|NodeJS.Signals) {
      actionsDebug("%s call kill with %s", options.id, signal);
      if(childProcess?.killed) return childProcess?.killed;
      return childProcess.kill(signal);
    },
    stopServer() {
      actionsDebug("%s call stop server", options.id);
      if (options.hooks.stopServer === undefined) childProcess.kill("SIGKILL");
      const data = options.hooks.stopServer({child: childProcess, actions: serverObject});
      if (!data) return serverObject.waitExit();
      return data;
    },
    async waitExit(): Promise<number|NodeJS.Signals> {
      if (childProcess.exitCode||childProcess.signalCode) return childProcess.exitCode||childProcess.signalCode;
      return new Promise<number>((done, reject) => {
        childProcess.once("error", err => reject(err));
        childProcess.once("close", code => done(code));
      });
    },
    tp(playerName: string, x: number|string = 0, y: number|string = 0, z: number|string = 0) {
      const tpfunction = options.hooks.playerTp;
      if (tpfunction === undefined) throw new Error("tp is disabled, tpfunction not defined to platform!");
      if (!(playerName?.startsWith("@")||!!this.playerActions[playerName])) throw new Error("Player or target not exist");
      tpfunction(serverObject, playerName, x, y, z);
      return serverObject;
    }
  };

  // Add to internal sessions
  internalSessions[options.id] = serverObject;
  serverObject.events.on("exit", () => delete internalSessions[options.id]);

  // Break lines with readline
  const readlineStdout = readline.createInterface(childProcess.stdout);
  readlineStdout.on("line", data => {
    serverObject.events.emit("log", data);
    serverObject.events.emit("log_stdout", data)
  });
  const readlineStderr = readline.createInterface(childProcess.stderr);
  readlineStderr.on("line", data => {
    serverObject.events.emit("log", data);
    serverObject.events.emit("log_stderr", data);
  });

  // Register hooks
  // Server avaible to player
  if (options.hooks.serverStarted) {
    actionsDebug("Register server started function to %s", options.id);
    function started(data: string) {
      return options.hooks.serverStarted(data, onAvaible => {
        actionsDebug("Call server started function to %s", options.id);
        if (serverObject.serverStarted) return;
        serverObject.serverStarted = onAvaible;
        serverObject.events.emit("serverStarted", onAvaible);
      });
    }
    readlineStderr.on("line", started);
    readlineStdout.on("line", started);
  }

  // Server Player actions
  if (options.hooks.playerAction) {
    function updateHistoric(action: playerHistoric[0]["action"], data: playerBase) {
      if (!serverObject.playerActions[data.playerName]) {
        serverObject.playerActions[data.playerName] = {
          action,
          date: data.connectTime,
          history: [
            {
              action,
              date: data.connectTime
            }
          ]
        };
        return;
      }
      serverObject.playerActions[data.playerName].action = action;
      serverObject.playerActions[data.playerName].date = data.connectTime;
      serverObject.playerActions[data.playerName].history.push({
        action,
        date: data.connectTime
      });
    }
    actionsDebug("Register player actions to %s", options.id);
    const playerConnect = (data: playerBase) => {
      actionsDebug("Player actions to %s, call connect", options.id);
      serverObject.events.emit("playerConnect", data);
      updateHistoric("connect", data);
    }
    const playerSpawn = (data: playerBase) => {
      actionsDebug("Player actions to %s, call spawn", options.id);
      serverObject.events.emit("playerSpawn", data);
      updateHistoric("spawn", data);
    }
    const playerDisonnect = (data: playerBase) => {
      actionsDebug("Player actions to %s, call disconnect", options.id);
      serverObject.events.emit("playerDisconnect", data);
      updateHistoric("disconnect", data);
    }
    const playerUnknown = (data: playerBase) => {
      actionsDebug("Player actions to %s, call unknown", options.id);
      serverObject.events.emit("playerUnknown", data);
      updateHistoric("unknown", data);
    }
    const mainFunc = (data: string) => options.hooks.playerAction(data, {
      connect: playerConnect,
      disconnect: playerDisonnect,
      unknown: playerUnknown,
      spawn: playerSpawn
    });
    readlineStdout.on("line", mainFunc);
    readlineStderr.on("line", mainFunc);
  }

  // Port listen
  if (options.hooks.portListening) {
    actionsDebug("Register port listening to %s", options.id);
    const mainFunc = (data: string) => options.hooks.portListening(data, (portData) => {
      actionsDebug("Port listen to %s", options.id);
      serverObject.events.emit("portListening", portData);
      serverObject.portListening[portData.port] = portData;
    })
    readlineStdout.on("line", mainFunc);
    readlineStderr.on("line", mainFunc);
  }

  // Pipe logs
  if (processConfig.options.logPath) {
    actionsDebug("Pipe log to file in %s", options.id);
    childProcess.stdout.pipe(fs.createWriteStream(processConfig.options.logPath.stdout));
    if (processConfig.options.logPath.stderr) childProcess.stderr.pipe(fs.createWriteStream(processConfig.options.logPath.stderr));
  }

  // Add listeners to actions events
  childProcess.on("error", data => serverObject.events.emit("error", data));
  childProcess.on("exit", (code, signal) => serverObject.events.emit("exit", {code, signal}));
  childProcess.on("exit", () => serverObject.events.removeAllListeners());

  // Return session maneger
  return serverObject;
}
