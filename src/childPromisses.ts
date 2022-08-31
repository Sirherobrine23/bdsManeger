import type { ObjectEncodingOptions } from "node:fs";
import { execFile, exec as nodeExec, ExecFileOptions, ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { promisify } from "node:util";
export {execFile};
export const execAsync = promisify(nodeExec);
// export const execFileAsync = promisify(execFile);

export type execOptions = ObjectEncodingOptions & ExecFileOptions & {stdio?: "ignore"|"inherit"};
export function execFileAsync(command: string): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, args: string[]): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, options: execOptions): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, args: string[], options: execOptions): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, args?: execOptions|string[], options?: execOptions) {
  let childOptions: execOptions = {};
  let childArgs: string[] = [];
  if (args instanceof Array) childArgs = args; else if (args instanceof Object) childOptions = args as execOptions;
  if (options) childOptions = options;
  if (childOptions?.env) childOptions.env = {...process.env, ...childOptions.env};
  return new Promise<{stdout: string, stderr: string}>((resolve, rejectExec) => {
    const child = execFile(command, childArgs, childOptions, (err, out, err2) => {if (err) return rejectExec(err);resolve({stdout: out, stderr: err2});});
    if (options?.stdio === "inherit") {
      child.stdout.on("data", data => process.stdout.write(data));
      child.stderr.on("data", data => process.stderr.write(data));
    }
  });
}

export class customChild {
  private eventMiter = new EventEmitter({captureRejections: false});

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

  public child: ChildProcess;
  private tempLog = {};
  constructor(child: ChildProcess) {
    this.child = child;
    child.on("close", (code, signal) => this.emit("close", {code, signal}));
    child.on("exit", (code, signal) => this.emit("close", {code, signal}));
    child.on("error", err => this.emit("error", err));
    child.stdout.on("data", data => this.eventMiter.emit("stdoutRaw", data instanceof Buffer ? data.toString("utf8"):data));
    child.stderr.on("data", data => this.eventMiter.emit("stderrRaw", data instanceof Buffer ? data.toString("utf8"):data));
    // Storage tmp lines
    const parseLog = (to: "breakStdout"|"breakStderr", data: string): any => {
      if (this.tempLog[to] === undefined) this.tempLog[to] = "";
      const lines = data.split(/\r?\n/);
      if (lines.length === 1) return this.tempLog[to] += lines[0];
      const a = lines.pop();
      if (a !== "") lines.push(a);
      for (const line of lines) {
        if (!this.tempLog[to]) {
          this.eventMiter.emit(to, line);
          continue;
        }
        this.tempLog[to]+=line;
        this.eventMiter.emit(to, this.tempLog[to]);
        this.tempLog[to] = "";
      }
    }
    child.stdout.on("data", data => parseLog("breakStdout", data));
    child.stderr.on("data", data => parseLog("breakStderr", data));
  }
};

export function exec(command: string): customChild;
export function exec(command: string, args: string[]): customChild;
export function exec(command: string, options: ObjectEncodingOptions & ExecFileOptions): customChild;
export function exec(command: string, args: string[], options: ObjectEncodingOptions & ExecFileOptions): customChild;
export function exec(command: string, args?: ObjectEncodingOptions & ExecFileOptions|string[], options?: ObjectEncodingOptions & ExecFileOptions): customChild {
  let childOptions: ObjectEncodingOptions & ExecFileOptions = {};
  let childArgs: string[] = [];
  if (args instanceof Array) childArgs = args; else if (args instanceof Object) childOptions = args as execOptions;
  if (options) childOptions = options;
  if (childOptions?.env) childOptions.env = {...process.env, ...childOptions.env};
  return new customChild(execFile(command, childArgs, childOptions));
}