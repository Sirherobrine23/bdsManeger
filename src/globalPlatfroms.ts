import type { customChild } from "./childPromisses";
import { EventEmitter } from "node:events";

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
  run: (childProcess: customChild) => void
}

export type actionTp = {
  name: "tp",
  run: (childProcess: customChild, x: number|string, y: number|string, z: number|string) => void
}

export type actionRun = actionsServerStop|actionTp;
export type actionCallback = actionsPlayer|actionsPort|actionsServerStarted|actionsServerStarted;
export type actionConfig = actionCallback|actionRun;
export class actions {
  private events = new EventEmitter({captureRejections: false});
  public childProcess: customChild;
  private stopServerFunction?: (childProcess: customChild) => void;
  private tpfunction?: (childProcess: customChild, x: number|string, y: number|string, z: number|string) => void;

  public on(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  public on(act: "portListening", fn: (data: portListen) => void): this;
  public on(act: "serverStarted", fn: (data: serverStarted) => void): this;
  public on(act: "log_stderr", fn: (data: string) => void): this;
  public on(act: "log_stdout", fn: (data: string) => void): this;
  public on(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  public on(act: string, fn: (...args: any[]) => void) {this.events.on(act, fn); return this;}

  public once(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  public once(act: "portListening", fn: (data: portListen) => void): this;
  public once(act: "serverStarted", fn: (data: serverStarted) => void): this;
  public once(act: "log_stderr", fn: (data: string) => void): this;
  public once(act: "log_stdout", fn: (data: string) => void): this;
  public once(act: "exit", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  public once(act: string, fn: (...args: any[]) => void) {this.events.once(act, fn); return this;}

  public stopServer() {
    if (typeof this.stopServer === "undefined") this.childProcess.kill("SIGKILL");
    this.stopServerFunction(this.childProcess);
    return this;
  }

  public waitExit() {
    if (this.childProcess.child.exitCode === null) return new Promise<number>((done, reject) => {
      this.childProcess.child.once("error", err => reject(err));
      this.childProcess.child.once("exit", code => {
        if (code === 0) return done(code);
        reject(new Error(`Server exit with ${code} code.`));
      });
    });
    return Promise.resolve(this.childProcess.child.exitCode);
  }

  public tp(x: number|string = 0, y: number|string = 0, z: number|string = 0) {
    if (typeof this.stopServer === "undefined") throw new Error("TP command not configured!");
    this.tpfunction(this.childProcess, x, y, z);
    return this;
  }

  public runCommand(...command: Array<string|number>) {
    const psCommand = command.map(a => String(a));
    this.childProcess.writeStdin(psCommand.join(" "));
  }

  public portListening: portListen[] = [];
  public playerActions: playerClass = {};

  constructor(child: customChild, config: actionConfig[]) {
    this.childProcess = child;
    child.on("close", data => this.events.emit("exit", data));
    child.on("breakStdout", data => this.events.emit("log_stdout", data));
    child.on("breakStderr", data => this.events.emit("log_stderr", data));

    this.on("portListening", data => this.portListening.push(data));
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

    const actions = config.filter((a: actionCallback) => typeof a?.callback === "function") as actionCallback[];
    child.on("breakStdout", data => actions.forEach(fn => fn.callback(data, (...args: any[]) => this.events.emit(fn.name, ...args))));
    child.on("breakStderr", data => actions.forEach(fn => fn.callback(data, (...args: any[]) => this.events.emit(fn.name, ...args))));
    for (const action of (config.filter((a: actionRun) => typeof a?.run === "function") as actionRun[])) {
      if (action.name === "serverStop") this.stopServerFunction = action.run;
    }
  }
}