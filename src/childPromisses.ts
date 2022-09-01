import { ObjectEncodingOptions, createWriteStream, WriteStream } from "node:fs";
import * as child_process from "node:child_process";
import { EventEmitter } from "node:events";
export const execFile = child_process.execFile;

export type ExecFileOptions = ObjectEncodingOptions & child_process.ExecFileOptions & {stdio?: "ignore"|"inherit"};
export function execFileAsync(command: string): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, args: string[]): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, options: ExecFileOptions): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, args: string[], options: ExecFileOptions): Promise<{stdout: string, stderr: string}>;
export function execFileAsync(command: string, args?: ExecFileOptions|string[], options?: ExecFileOptions) {
  let childOptions: ExecFileOptions = {};
  let childArgs: string[] = [];
  if (args instanceof Array) childArgs = args; else if (args instanceof Object) childOptions = args as ExecFileOptions;
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

export type execAsyncOptions = child_process.ExecOptions & {encoding?: BufferEncoding} & {stdio?: "ignore"|"inherit"};
export function execAsync(command: string): Promise<{stdout: string, stderr: string}>;
export function execAsync(command: string, options: execAsyncOptions): Promise<{stdout: string, stderr: string}>;
export function execAsync(command: string, options?: execAsyncOptions) {
  let childOptions: execAsyncOptions = {};
  if (options) childOptions = options;
  if (childOptions?.env) childOptions.env = {...process.env, ...childOptions.env};
  return new Promise<{stdout: string, stderr: string}>((resolve, rejectExec) => {
    const child = child_process.exec(command, {...childOptions}, (err, out: string|Buffer, err2: string|Buffer) => {if (err) return rejectExec(err);resolve({stdout: ((out instanceof Buffer) ? out.toString():out), stderr: (err2 instanceof Buffer)?err2.toString():err2});});
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

  public child: child_process.ChildProcess;
  public logStream?: {stdout: WriteStream, stderr?: WriteStream};
  private tempLog = {};
  constructor(child: child_process.ChildProcess, logStream?: {stdout: WriteStream, stderr?: WriteStream}) {
    this.child = child;
    if (logStream) {
      this.logStream = logStream;
      this.child.stdout.pipe(this.logStream.stdout);
      if (this.logStream.stderr) this.child.stderr.pipe(this.logStream.stderr);
    }
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

export type execOptions = ObjectEncodingOptions & child_process.ExecFileOptions & {logPath?: {stdout: string, stderr?: string}};
export function exec(command: string): customChild;
export function exec(command: string, args: string[]): customChild;
export function exec(command: string, options: execOptions): customChild;
export function exec(command: string, args: string[], options: execOptions): customChild;
export function exec(command: string, args?: execOptions|string[], options?: execOptions): customChild {
  let childOptions: execOptions = {};
  let childArgs: string[] = [];
  if (args instanceof Array) childArgs = args; else if (args instanceof Object) childOptions = args as execOptions;
  if (options) childOptions = options;
  if (childOptions?.env) childOptions.env = {...process.env, ...childOptions.env};
  let logStream: undefined|{stdout: WriteStream, stderr?: WriteStream} = undefined;
  if (childOptions.logPath) logStream = {
    stdout: createWriteStream(childOptions.logPath.stdout, {flags: "a", autoClose: true}),
    stderr: (!!childOptions.logPath.stderr)?createWriteStream(childOptions.logPath.stderr, {flags: "a", autoClose: true}):undefined
  };
  return new customChild(execFile(command, childArgs, childOptions), logStream);
}