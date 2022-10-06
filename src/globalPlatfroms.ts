import fs from "node:fs";
import readline from "node:readline";
import child_process from "node:child_process";
import { EventEmitter } from "node:events";
import type { pluginManeger } from "./plugin/plugin";
import type { script_hook } from "./plugin/hook";
import { bdsPlatform } from "./platformPathManeger";
export const internalSessions: {[sessionID: string]: serverActionV2|actions} = {};
export type actionCommandOption = {command: string, args?: string[], options?: fs.ObjectEncodingOptions & child_process.ExecFileOptions & {logPath?: {stdout: string, stderr?: string}}};

export type playerHistoric = {[player: string]: {action: "connect"|"disconnect"|"unknown"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"; date: Date}>}};
export type playerBase = {playerName: string, connectTime: Date, xuid?: string, action?: string};
export type actionsPlayer = {
  name: "playerAction",
  callback: (data: string, playerConnect: (player: playerBase) => void, playerDisconnect: (player: playerBase) => void, playerUnknown: (player: playerBase) => void) => void
};

export type portListen = {port: number, host?: string, type: "TCP"|"UDP"|"TCP/UDP", protocol: "IPv4"|"IPv6"|"IPV4/IPv6"|"Unknown", proxyOrigin?: number, plugin?: string};
export type actionsPort = {
  name: "portListening",
  callback: (data: string, done: (portInfo: portListen) => void) => void
}

export type serverStarted = Date;
export type actionsServerStarted = {
  name: "serverStarted",
  callback: (data: string, done: (started: serverStarted) => void) => void
}

export type actionsServerStop = {
  name: "serverStop",
  run: (childProcess: actions) => void
}

export type actionTp = {
  name: "tp",
  run: (childProcess: actions, x: number|string, y: number|string, z: number|string) => void
}

export type actionPlugin = {
  name: "pluginManeger",
  class: () => pluginManeger|Promise<pluginManeger>
};

export type actionHooks = {
  name: "pluginHooks",
  class: (runAcions: actions) => script_hook|Promise<script_hook>
}

export type actionRun = actionsServerStop|actionTp;
export type actionCallback = actionsPlayer|actionsPort|actionsServerStarted|actionsServerStarted;
export type actionConfig = actionCallback|actionRun|actionPlugin|actionHooks;

export declare interface actions {
  on(act: "error", fn: (data: any) => void): this;
  once(act: "error", fn: (data: any) => void): this;
  // emit(act: "error", data: any): boolean;

  on(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  once(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  // emit(act: "playerConnect"|"playerDisconnect"|"playerUnknown", data: playerBase): boolean;

  on(act: "portListening", fn: (data: portListen) => void): this;
  once(act: "portListening", fn: (data: portListen) => void): this;
  // emit(act: "portListening", data: portListen): boolean;

  on(act: "serverStarted", fn: (data: serverStarted) => void): this;
  once(act: "serverStarted", fn: (data: serverStarted) => void): this;
  // emit(act: "serverStarted", data: serverStarted): boolean;

  on(act: "log_stderr", fn: (data: string) => void): this;
  once(act: "log_stderr", fn: (data: string) => void): this;
  // emit(act: "log_stderr", data: string): boolean;

  on(act: "log_stdout", fn: (data: string) => void): this;
  once(act: "log_stdout", fn: (data: string) => void): this;
  // emit(act: "log_stdout", data: string): boolean;

  on(act: "log", fn: (data: string) => void): this;
  once(act: "log", fn: (data: string) => void): this;
  // emit(act: "log", data: string): boolean;

  on(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  once(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  // emit(act: "exit", data: {code: number, signal: NodeJS.Signals}): boolean;
}

export class actions extends EventEmitter {
  static version: 1 = 1;
  #childProcess: child_process.ChildProcess;
  public runCommand(...command: Array<string|number|boolean>) {
    this.#childProcess.stdin.write(command.map(a => String(a)).join(" ")+"\n");
    return this;
  }
  public killProcess(signal?: number|NodeJS.Signals) {
    if(this.#childProcess?.killed) return this.#childProcess?.killed;
    return this.#childProcess?.kill(signal);
  }

  public plugin?: pluginManeger;
  public hooks?: script_hook;
  public platform?: string;
  public portListening: portListen[] = [];
  public playerActions: playerHistoric = {};

  #stopServerFunction: (actions: actions) => void;
  public stopServer() {
    if (this.#stopServerFunction === undefined) this.#childProcess.kill("SIGKILL");
    this.#stopServerFunction(this);
    return this.waitExit();
  }

  public async waitExit(): Promise<number> {
    if (this.#childProcess.exitCode !== null) return this.#childProcess.exitCode;
    return new Promise<number>((done, reject) => {
      this.#childProcess.once("error", err => reject(err));
      this.#childProcess.once("close", code => done(code));
    });
  }

  #tpfunction?: (actions: actions, playerName: string, x: number|string, y: number|string, z: number|string) => void;
  public tp(playerName: string, x: number|string = 0, y: number|string = 0, z: number|string = 0) {
    if (this.#tpfunction === undefined) throw new Error("tp is disabled, tpfunction not defined to platform!");
    if (!(playerName?.startsWith("@")||!!this.playerActions[playerName])) throw new Error("Player or target not exist");
    this.#tpfunction(this, playerName, x, y, z);
    return this;
  }

  public processConfig: actionCommandOption;
  public id: string;
  constructor(platformConfig: {id: string, processConfig: actionCommandOption, hooks?: actionConfig[]}) {
    if (internalSessions[platformConfig.id]) throw new Error("The platform with that id is already running!");
    super({captureRejections: false});
    internalSessions[platformConfig.id] = this;
    this.setMaxListeners(0);
    this.once("exit", () => delete internalSessions[platformConfig.id]);

    if (!platformConfig?.processConfig.args) platformConfig.processConfig.args = [];
    if (!platformConfig?.processConfig.options) platformConfig.processConfig.options = {};

    // Disable log buffer limit
    platformConfig.processConfig.options.maxBuffer = Infinity;

    // Add ID and Actions contructor to global class
    this.processConfig = platformConfig.processConfig;
    this.id = platformConfig.id;

    // Run commands
    this.#childProcess = child_process.execFile(platformConfig?.processConfig.command, platformConfig?.processConfig.args, platformConfig?.processConfig.options);

    // Pipe logs
    if (platformConfig?.processConfig.options.logPath) {
      if (platformConfig?.processConfig.options.logPath.stderr) this.#childProcess.stderr.pipe(fs.createWriteStream(platformConfig?.processConfig.options.logPath.stderr));
      this.#childProcess.stdout.pipe(fs.createWriteStream(platformConfig?.processConfig.options.logPath.stdout));
    }

    // Add listeners to actions events
    this.#childProcess.on("error", data => this.emit("error", data));
    this.#childProcess.on("exit", (code, signal) => this.emit("exit", {code, signal}));

    // Break lines with readline
    const readlineStdout = readline.createInterface(this.#childProcess.stdout);
    readlineStdout.on("line", data => this.emit("log", data));
    readlineStdout.on("line", data => this.emit("log_stdout", data));
    const readlineStderr = readline.createInterface(this.#childProcess.stderr);
    readlineStderr.on("line", data => this.emit("log", data));
    readlineStderr.on("line", data => this.emit("log_stderr", data));

    const plug = platformConfig?.hooks?.find((a: actionPlugin) => a?.name === "pluginManeger") as actionPlugin;
    const hooks = platformConfig?.hooks?.find((a: actionHooks) => a?.name === "pluginHooks") as actionHooks;
    if (!!hooks) Promise.resolve().then(() => hooks.class(this)).then(res => this.hooks = res);
    if (!!plug) Promise.resolve().then(() => plug.class()).then(res => this.plugin = res).catch(err => this.emit("error", err));

    // Ports listening
    this.on("portListening", data => this.portListening.push(data));
    // Player join to server
    this.on("playerConnect", (data): any => {
      if (!this.playerActions[data.playerName]) return this.playerActions[data.playerName] = {
        action: "connect",
        date: data.connectTime,
        history: [{action: "connect", date: data.connectTime}]
      }
      this.playerActions[data.playerName].action = "connect";
      this.playerActions[data.playerName].date = data.connectTime;
      this.playerActions[data.playerName].history.push({action: "connect", date: data.connectTime});
    });
    // Server left from server
    this.on("playerDisconnect", (data): any => {
      if (!this.playerActions[data.playerName]) return this.playerActions[data.playerName] = {
        action: "disconnect",
        date: data.connectTime,
        history: [{action: "disconnect", date: data.connectTime}]
      }
      this.playerActions[data.playerName].action = "disconnect";
      this.playerActions[data.playerName].date = data.connectTime;
      this.playerActions[data.playerName].history.push({action: "disconnect", date: data.connectTime});
    });
    // PLayer action so not infomed
    this.on("playerUnknown", (data): any => {
      if (!this.playerActions[data.playerName]) return this.playerActions[data.playerName] = {
        action: "unknown",
        date: data.connectTime,
        history: [{action: "unknown", date: data.connectTime}]
      }
      this.playerActions[data.playerName].action = "unknown";
      this.playerActions[data.playerName].date = data.connectTime;
      this.playerActions[data.playerName].history.push({action: "unknown", date: data.connectTime});
    });

    // Callbacks
    (platformConfig?.hooks?.filter((a: actionCallback) => typeof a?.callback === "function")).forEach((fn: actionCallback) => {
      // Use new player actions
      if (fn.name === "playerAction") {
        const playerConnect = (data: playerBase) => this.emit("playerConnect", data), playerDisonnect = (data: playerBase) => this.emit("playerDisconnect", data), playerUnknown = (data: playerBase) => this.emit("playerUnknown", data);
        this.on("log", data => fn.callback(data, playerConnect, playerDisonnect, playerUnknown));
        return;
      }
      this.on("log", data => fn.callback(data, (...args: any[]) => this.emit(fn.name, ...args)));
    });

    // Set backend run function
    (platformConfig?.hooks?.filter((a: actionRun) => typeof a?.run === "function")).forEach((action: actionRun) => {
      if (action.name === "serverStop") this.#stopServerFunction = action.run;
      else if (action.name === "tp") this.#tpfunction = action.run;
    });
  }
}

export declare interface serverActionsEvent {
  on(act: "error", fn: (data: any) => void): this;
  once(act: "error", fn: (data: any) => void): this;
  emit(act: "error", data: any): boolean;

  on(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  once(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  emit(act: "playerConnect"|"playerDisconnect"|"playerUnknown", data: playerBase): boolean;

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

export type actionsV2 = {
  serverStarted?: (data: string, done: (startedDate: Date) => void) => void,
  portListening?: (data: string, done: (portInfo: portListen) => void) => void,
  playerAction?: (data: string, playerConnect: (player: playerBase) => void, playerDisconnect: (player: playerBase) => void, playerUnknown: (player: playerBase) => void) => void,
  stopServer?: (components: {child: child_process.ChildProcess, actions: serverActionV2}) => void|Promise<number>,
  playerTp?: (actions: serverActionV2, playerName: string, x: number|string, y: number|string, z: number|string) => void,
};

export type serverActionV2 = {
  version: 2,
  folderId: string,
  platform: bdsPlatform,
  events: serverActionsEvent,
  serverCommand?: actionCommandOption,
  killProcess?: (signal?: number|NodeJS.Signals) => boolean,
  waitExit?: () => Promise<number>
  stopServer?: () => Promise<number>,
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
  const {processConfig} = options;
  const serverObject: serverActionV2 = {
    version: 2,
    folderId: options.id,
    platform: options.platform,
    events: new serverActionsEvent({captureRejections: false}),
    playerActions: {},
    portListening: {}
  };

  // Add event listeners

  // Port listen
  serverObject.events.on("portListening", data => serverObject.portListening[data.port] = data);

  // Player join to server
  serverObject.events.on("playerConnect", (data): any => {
    if (!serverObject.playerActions[data.playerName]) return serverObject.playerActions[data.playerName] = {action: "connect", date: data.connectTime, history: [{action: "connect", date: data.connectTime}]};
    serverObject.playerActions[data.playerName].action = "connect";
    serverObject.playerActions[data.playerName].date = data.connectTime;
    serverObject.playerActions[data.playerName].history.push({action: "connect", date: data.connectTime});
  });
  // Server left from server
  serverObject.events.on("playerDisconnect", (data): any => {
    if (!serverObject.playerActions[data.playerName]) return serverObject.playerActions[data.playerName] = {action: "disconnect", date: data.connectTime, history: [{action: "disconnect", date: data.connectTime}]};
    serverObject.playerActions[data.playerName].action = "disconnect";
    serverObject.playerActions[data.playerName].date = data.connectTime;
    serverObject.playerActions[data.playerName].history.push({action: "disconnect", date: data.connectTime});
  });
  // Player action so not infomed
  serverObject.events.on("playerUnknown", (data): any => {
    if (!serverObject.playerActions[data.playerName]) return serverObject.playerActions[data.playerName] = {action: "unknown", date: data.connectTime, history: [{action: "unknown", date: data.connectTime}]};
    serverObject.playerActions[data.playerName].action = "unknown";
    serverObject.playerActions[data.playerName].date = data.connectTime;
    serverObject.playerActions[data.playerName].history.push({action: "unknown", date: data.connectTime});
  });

  // Add exec options if not exists
  if (!processConfig.args) processConfig.args = [];
  if (!processConfig.options) processConfig.options = {};
  // Disable log buffer limit
  processConfig.options.maxBuffer = Infinity;
  processConfig.options.env = {...process.env, ...(processConfig.options.env||{})}

  // Run commands
  const childProcess = child_process.execFile(processConfig.command, processConfig.args, processConfig.options);
  serverObject.serverCommand = processConfig;

  // Pipe logs
  if (processConfig.options.logPath) {
    childProcess.stdout.pipe(fs.createWriteStream(processConfig.options.logPath.stdout));
    if (processConfig.options.logPath.stderr) childProcess.stderr.pipe(fs.createWriteStream(processConfig.options.logPath.stderr));
  }

  // Add listeners to actions events
  childProcess.on("error", data => serverObject.events.emit("error", data));
  childProcess.on("exit", (code, signal) => serverObject.events.emit("exit", {code, signal}));

  // Break lines with readline
  const readlineStdout = readline.createInterface(childProcess.stdout);
  readlineStdout.on("line", data => serverObject.events.emit("log", data));
  readlineStdout.on("line", data => serverObject.events.emit("log_stdout", data));
  const readlineStderr = readline.createInterface(childProcess.stderr);
  readlineStderr.on("line", data => serverObject.events.emit("log", data));
  readlineStderr.on("line", data => serverObject.events.emit("log_stderr", data));

  // Server options
  serverObject.runCommand = function runCommand(...command: Array<string|number|boolean>) {
    childProcess.stdin.write(command.map(a => String(a)).join(" ")+"\n");
    return serverObject;
  }

  serverObject.killProcess = function killProcess(signal?: number|NodeJS.Signals) {
    if(childProcess?.killed) return childProcess?.killed;
    return childProcess.kill(signal);
  }

  serverObject.stopServer = function stopServer() {
    if (options.hooks.stopServer === undefined) childProcess.kill("SIGKILL");
    options.hooks.stopServer({child: childProcess, actions: serverObject});
    return serverObject.waitExit();
  }

  serverObject.waitExit = async function waitExit(): Promise<number> {
    if (childProcess.exitCode !== null) return childProcess.exitCode;
    return new Promise<number>((done, reject) => {
      childProcess.once("error", err => reject(err));
      childProcess.once("close", code => done(code));
    });
  }

  serverObject.tp = function tp(playerName: string, x: number|string = 0, y: number|string = 0, z: number|string = 0) {
    const tpfunction = options.hooks.playerTp;
    if (tpfunction === undefined) throw new Error("tp is disabled, tpfunction not defined to platform!");
    if (!(playerName?.startsWith("@")||!!this.playerActions[playerName])) throw new Error("Player or target not exist");
    tpfunction(serverObject, playerName, x, y, z);
    return serverObject;
  }

  // Register hooks
  // Server avaible to player
  if (options.hooks.serverStarted) serverObject.events.on("log", data => options.hooks.serverStarted(data, onAvaible => serverObject.events.emit("serverStarted", onAvaible)));

  // Server Player actions
  if (options.hooks.playerAction) {
    const playerConnect = (data: playerBase) => serverObject.events.emit("playerConnect", data);
    const playerDisonnect = (data: playerBase) => serverObject.events.emit("playerDisconnect", data);
    const playerUnknown = (data: playerBase) => serverObject.events.emit("playerUnknown", data);
    serverObject.events.on("log", data => options.hooks.playerAction(data, playerConnect, playerDisonnect, playerUnknown));
  }

  // Port listen
  if (options.hooks.portListening) serverObject.events.on("log", data => options.hooks.portListening(data, (portData) => serverObject.events.emit("portListening", portData)));

  // Return session maneger
  internalSessions[options.id] = serverObject;
  serverObject.events.on("exit", () => delete internalSessions[options.id]);
  return serverObject;
}