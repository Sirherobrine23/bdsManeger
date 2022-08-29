import type { customChild } from "./childPromisses";
import { EventEmitter } from "node:events";

export type playerBase = {playerName: string, connectTime: Date, xuid?: string};
export type actionsPlayer = {
  name: "playerConnect"|"playerDisconnect"|"playerUnknown",
  callback: (data: string, done: (player: playerBase) => void) => void
}

export type portListen = {port: number, host?: string, type: "TCP"|"UDP"|"TCP/UDP", protocol: "IPv4"|"IPv6"|"IPV4/IPv6"|"Unknown"};
export type actionsPort = {
  name: "portListening",
  callback: (data: string, done: (portInfo: portListen) => void) => void
}

export type serverStarted = Date;
export type actionsServerStarted = {
  name: "serverStarted",
  callback: (data: string, done: (started: serverStarted) => void) => void
}

export type actionConfig = actionsPlayer|actionsPort|actionsServerStarted|actionsServerStarted;
export class actions {
  private events = new EventEmitter({captureRejections: false});

  on(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  on(act: "portListening", fn: (data: portListen) => void): this;
  on(act: "serverStarted", fn: (data: serverStarted) => void): this;
  on(act: string, fn: (...args: any[]) => void) {this.events.on(act, fn); return this;}

  once(act: "playerConnect"|"playerDisconnect"|"playerUnknown", fn: (data: playerBase) => void): this;
  once(act: "portListening", fn: (data: portListen) => void): this;
  once(act: "serverStarted", fn: (data: serverStarted) => void): this;
  once(act: string, fn: (...args: any[]) => void) {this.events.once(act, fn); return this;}

  constructor(child: customChild, config: actionConfig[]) {
    child.on("breakStdout", data => config.forEach(fn => fn.callback(data, (...args) => this.events.emit(fn.name, ...args))));
    child.on("breakStderr", data => config.forEach(fn => fn.callback(data, (...args) => this.events.emit(fn.name, ...args))));
  }
}