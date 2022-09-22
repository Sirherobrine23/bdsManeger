import fs from "node:fs";
import readline from "node:readline";
import child_process from "node:child_process";
import { EventEmitter } from "node:events";
import type {pluginManeger as globalPluginManeger} from "./plugin/main";

export type playerClass = {[player: string]: {action: "connect"|"disconnect"|"unknown"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"; date: Date}>}};
export type playerBase = {playerName: string, connectTime: Date, xuid?: string};
export type actionsPlayer = {
  name: "playerConnect"|"playerDisconnect"|"playerUnknown",
  callback: (data: string, done: (player: playerBase) => void) => void
}

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
  class: () => globalPluginManeger
};

export type actionRun = actionsServerStop|actionTp;
export type actionCallback = actionsPlayer|actionsPort|actionsServerStarted|actionsServerStarted;
export type actionConfig = actionCallback|actionRun|actionPlugin;

export declare interface actions {
  on(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  on(act: "portListening", fn: (data: portListen) => void): this;
  on(act: "serverStarted", fn: (data: serverStarted) => void): this;
  on(act: "log_stderr", fn: (data: string) => void): this;
  on(act: "log_stdout", fn: (data: string) => void): this;
  on(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;

  once(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  once(act: "portListening", fn: (data: portListen) => void): this;
  once(act: "serverStarted", fn: (data: serverStarted) => void): this;
  once(act: "log_stderr", fn: (data: string) => void): this;
  once(act: "log_stdout", fn: (data: string) => void): this;
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

  #stopServerFunction: (childProcess: actions) => void = (child) => child.#childProcess.kill("SIGKILL");
  #tpfunction?: (childProcess: actions, x: number|string, y: number|string, z: number|string) => void;

  public plugin?: globalPluginManeger;

  public portListening: portListen[] = [];
  public playerActions: playerClass = {};

  public stopServer() {
    if (typeof this.stopServer === "undefined") this.#childProcess.kill("SIGKILL");
    this.#stopServerFunction(this);
    return this.waitExit();
  }

  public waitExit(): Promise<number> {
    if (this.#childProcess.exitCode === null) return new Promise<number>((done, reject) => {
      this.#childProcess.once("error", err => reject(err));
      this.#childProcess.once("exit", code => {
        if (code === 0) return done(code);
        reject(new Error(`Server exit with ${code} code.`));
      });
    });
    return Promise.resolve(this.#childProcess.exitCode);
  }

  public tp(x: number|string = 0, y: number|string = 0, z: number|string = 0) {
    if (typeof this.stopServer === "undefined") throw new Error("TP command not configured!");
    this.#tpfunction(this, x, y, z);
    return this;
  }

  public processConfig: actionCommandOption;
  constructor(processConfig: actionCommandOption, config: actionConfig[]) {
    super({captureRejections: false});
    if (!processConfig.args) processConfig.args = [];
    if (!processConfig.options) processConfig.options = {};
    processConfig.options.maxBuffer = Infinity;
    this.processConfig = processConfig;
    this.#childProcess = child_process.execFile(processConfig.command, processConfig.args, processConfig.options);

    if (processConfig.options.logPath) {
      this.#childProcess.stdout.pipe(fs.createWriteStream(processConfig.options.logPath.stdout));
      if (processConfig.options.logPath.stderr) this.#childProcess.stderr.pipe(fs.createWriteStream(processConfig.options.logPath.stderr));
    }

    this.#childProcess.on("error", data => this.emit("error", data));
    this.#childProcess.on("close", (code, signal) => this.emit("exit", {code, signal}));
    const readlineStdout = readline.createInterface(this.#childProcess.stdout);
    readlineStdout.on("line", data => this.emit("log_stdout", data));
    const readlineStderr = readline.createInterface(this.#childProcess.stderr);
    readlineStderr.on("line", data => this.emit("log_stderr", data));

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
    (config.filter((a: actionCallback) => typeof a?.callback === "function") as actionCallback[]).forEach(fn => {
      this.on("log_stdout", data => fn.callback(data, (...args: any[]) => this.emit(fn.name, ...args)));
      this.on("log_stderr", data => fn.callback(data, (...args: any[]) => this.emit(fn.name, ...args)));
    });

    // Set backend run function
    (config.filter((a: actionRun) => typeof a?.run === "function") as actionRun[]).forEach(action => {
      if (action.name === "serverStop") this.#stopServerFunction = action.run;
      else if (action.name === "tp") this.#tpfunction = action.run;
    });

    // Plugin maneger
    (config.filter((a: actionPlugin) => !!a?.class) as actionPlugin[]).forEach(action => {
      if (action.name === "pluginManeger") this.plugin = action.class();
    });
  }
}