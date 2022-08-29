import type { ObjectEncodingOptions } from "node:fs";
import { execFile, exec as nodeExec, ExecFileOptions, ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { promisify } from "node:util";
export {execFile};
export const execFileAsync = promisify(execFile);
export const execAsync = promisify(nodeExec)

export class customChild {
  private eventMiter = new EventEmitter({captureRejections: false});
  private tempLog = {};
  private child?: ChildProcess;

  public kill(signal?: number|NodeJS.Signals) {if(this.child?.killed) return this.child?.killed;return this.child?.kill(signal);}
  public writeStdin(command: string, args?: string[]) {
    let toWrite = command;
    if (args?.length > 0) toWrite += (" "+args.join(" "));
    toWrite+="\n";
    this.child.stdin.write(toWrite);
  }

  private emit(act: "error", data: Error): this;
  private emit(act: "close", data: {code: number, signal: NodeJS.Signals}): this;
  private emit(act: "stdoutRaw", data: string): this;
  private emit(act: "stderrRaw", data: string): this;
  private emit(act: "breakStdout", data: string): this;
  private emit(act: "breakStderr", data: string): this;
  private emit(act: string, ...args: any[]): this {this.eventMiter.emit(act, ...args); return this;}

  public on(act: "error", fn: (err: Error) => void): this;
  public on(act: "close", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  public on(act: "stdoutRaw", fn: (data: string) => void): this;
  public on(act: "stderrRaw", fn: (data: string) => void): this;
  public on(act: "breakStdout", fn: (data: string) => void): this;
  public on(act: "breakStderr", fn: (data: string) => void): this;
  public on(act: string, fn: (...args: any[]) => void): this {this.eventMiter.on(act, fn); return this;}

  public once(act: "stdoutRaw", fn: (data: string) => void): this;
  public once(act: "stderrRaw", fn: (data: string) => void): this;
  public once(act: "breakStdout", fn: (data: string) => void): this;
  public once(act: "breakStderr", fn: (data: string) => void): this;
  public once(act: string, fn: (...args: any[]) => void): this {this.eventMiter.once(act, fn);return this;}

  constructor(child: ChildProcess) {
    this.child = child;
    child.on("close", (code, signal) => this.emit("close", {code, signal}));
    child.on("exit", (code, signal) => this.emit("close", {code, signal}));
    child.on("error", err => this.emit("error", err));
    // Storage tmp lines
    const parseLog = (to: "breakStdout"|"breakStderr", data: string): any => {
      if (this.tempLog[to] === undefined) this.tempLog[to] = "";
      const lines = data.split(/\r?\n/);
      if (lines.length === 1) return this.tempLog[to] += lines[0];
      for (const line of lines.slice(0, -1)) {
        if (!this.tempLog[to]) return this.eventMiter.emit(to, line);
        this.eventMiter.emit(to, this.tempLog[to]+line);
        delete this.tempLog[to];
      }
    }
    child.stdout.on("data", data => parseLog("breakStdout", data));
    child.stderr.on("data", data => parseLog("breakStderr", data));
    child.stdout.on("data", data => this.eventMiter.emit("stdoutRaw", data instanceof Buffer ? data.toString("utf8"):data));
    child.stderr.on("data", data => this.eventMiter.emit("stderrRaw", data instanceof Buffer ? data.toString("utf8"):data));
  }
};

export function exec(command: string): customChild;
export function exec(command: string, args: string[]): customChild;
export function exec(command: string, options: ObjectEncodingOptions & ExecFileOptions): customChild;
export function exec(command: string, args: string[], options: ObjectEncodingOptions & ExecFileOptions): customChild;
export function exec(command: string, args?: ObjectEncodingOptions & ExecFileOptions|string[], options?: ObjectEncodingOptions & ExecFileOptions): customChild {
  let childOptions: ObjectEncodingOptions & ExecFileOptions = {};
  let childArgs: string[] = [];
  if (args instanceof Object) childOptions = args as ObjectEncodingOptions & ExecFileOptions; else if (args instanceof Array) childArgs = args;
  if (!options) childOptions = options;
  if (childOptions?.env) childOptions.env = {...process.env, ...childOptions.env};
  return new customChild(execFile(command, childArgs, childOptions));
}