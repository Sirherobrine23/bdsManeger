import fs from "node:fs";
import readline from "node:readline";
import child_process from "node:child_process";
import { EventEmitter } from "node:events";
import type { pluginManeger } from "./plugin/plugin";
import type { script_hook } from "./plugin/hook";

export type playerClass = {[player: string]: {action: "connect"|"disconnect"|"unknown"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"; date: Date}>}};
export type playerBase = {playerName: string, connectTime: Date, xuid?: string, action?: string};

export type actionsPlayer = {
  name: "playerAction",
  callback: (data: string, playerConnect: (player: playerBase) => void, playerDisconnect: (player: playerBase) => void, playerUnknown: (player: playerBase) => void) => void
};

export type portListen = {port: number, host?: string, type: "TCP"|"UDP"|"TCP/UDP", protocol: "IPv4"|"IPv6"|"IPV4/IPv6"|"Unknown", plugin?: string};
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
  class: () => Promise<pluginManeger>
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
  on(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  on(act: "portListening", fn: (data: portListen) => void): this;
  on(act: "serverStarted", fn: (data: serverStarted) => void): this;
  on(act: "log_stderr", fn: (data: string) => void): this;
  on(act: "log_stdout", fn: (data: string) => void): this;
  on(act: "log", fn: (data: string) => void): this;
  on(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;

  once(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  once(act: "portListening", fn: (data: portListen) => void): this;
  once(act: "serverStarted", fn: (data: serverStarted) => void): this;
  once(act: "log_stderr", fn: (data: string) => void): this;
  once(act: "log_stdout", fn: (data: string) => void): this;
  once(act: "log", fn: (data: string) => void): this;
  once(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
}

export type actionCommandOption = {command: string, args?: string[], options?: fs.ObjectEncodingOptions & child_process.ExecFileOptions & {logPath?: {stdout: string, stderr?: string}}};
export class actions extends EventEmitter {
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
  public playerActions: playerClass = {};
  #stopServerFunction: (actions: actions) => void = (child) => child.#childProcess.kill("SIGKILL");
  #tpfunction?: (actions: actions, playerName: string, x: number|string, y: number|string, z: number|string) => void = (actions, playerName, x,y,z) => actions.runCommand("tp", playerName, x,y,z);

  public stopServer() {
    if (typeof this.stopServer === "undefined") this.#childProcess.kill("SIGKILL");
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

  public tp(playerName: string, x: number|string = 0, y: number|string = 0, z: number|string = 0) {
    if (!(playerName.startsWith("@")||!!this.playerActions[playerName])) throw new Error("Player or target not exist");
    this.#tpfunction(this, playerName, x, y, z);
    return this;
  }

  public processConfig: actionCommandOption;
  constructor(platformConfig: {processConfig: actionCommandOption, hooks: actionConfig[]}) {
    super({captureRejections: false});
    if (!platformConfig?.processConfig.args) platformConfig.processConfig.args = [];
    if (!platformConfig?.processConfig.options) platformConfig.processConfig.options = {};
    platformConfig.processConfig.options.maxBuffer = Infinity;
    this.processConfig = platformConfig?.processConfig;
    this.#childProcess = child_process.execFile(platformConfig?.processConfig.command, platformConfig?.processConfig.args, platformConfig?.processConfig.options);
    if (platformConfig?.processConfig.options.logPath) {
      this.#childProcess.stdout.pipe(fs.createWriteStream(platformConfig?.processConfig.options.logPath.stdout));
      if (platformConfig?.processConfig.options.logPath.stderr) this.#childProcess.stderr.pipe(fs.createWriteStream(platformConfig?.processConfig.options.logPath.stderr));
    }

    this.#childProcess.on("error", data => this.emit("error", data));
    this.#childProcess.on("exit", (code, signal) => this.emit("exit", {code, signal}));
    const readlineStdout = readline.createInterface(this.#childProcess.stdout);
    const readlineStderr = readline.createInterface(this.#childProcess.stderr);
    readlineStdout.on("line", data => this.emit("log_stdout", data));
    readlineStderr.on("line", data => this.emit("log_stderr", data));
    readlineStdout.on("line", data => this.emit("log", data));
    readlineStderr.on("line", data => this.emit("log", data));

    const plug = platformConfig?.hooks?.find((a: actionPlugin) => a?.name === "pluginManeger") as actionPlugin;
    const hooks = platformConfig?.hooks?.find((a: actionHooks) => a?.name === "pluginHooks") as actionHooks;
    if (!!hooks) Promise.resolve().then(() => hooks.class(this)).then(res => this.hooks = res);
    if (!!plug) plug.class().then(res => this.plugin = res).catch(err => this.emit("error", err));

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
    (platformConfig?.hooks?.filter((a: actionCallback) => typeof a?.callback === "function") as actionCallback[]).forEach(fn => {
      // Use new player actions
      if (fn.name === "playerAction") {
        const playerConnect = (data: playerBase) => this.emit("playerConnect", data), playerDisonnect = (data: playerBase) => this.emit("playerDisconnect", data), playerUnknown = (data: playerBase) => this.emit("playerUnknown", data);
        this.on("log_stdout", data => fn.callback(data, playerConnect, playerDisonnect, playerUnknown));
        this.on("log_stderr", data => fn.callback(data, playerConnect, playerDisonnect, playerUnknown));
        return;
      }
      this.on("log_stdout", data => fn.callback(data, (...args: any[]) => this.emit(fn.name, ...args)));
      this.on("log_stderr", data => fn.callback(data, (...args: any[]) => this.emit(fn.name, ...args)));
    });

    // Set backend run function
    (platformConfig?.hooks?.filter((a: actionRun) => typeof a?.run === "function") as actionRun[]).forEach(action => {
      if (action.name === "serverStop") this.#stopServerFunction = action.run;
      else if (action.name === "tp") this.#tpfunction = action.run;
    });
  }
}