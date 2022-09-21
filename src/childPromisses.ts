import { ObjectEncodingOptions, createWriteStream, WriteStream } from "node:fs";
import * as child_process from "node:child_process";
import { EventEmitter } from "node:events";
import { createInterface } from "node:readline";
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
  childOptions.maxBuffer = Infinity;
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


export declare interface customChild {
  emit(act: "error", data: Error): boolean;
  emit(act: "close", data: {code: number, signal: NodeJS.Signals}): boolean;
  emit(act: "stdoutRaw", data: string): boolean;
  emit(act: "stderrRaw", data: string): boolean;
  emit(act: "stdout", data: string): boolean;
  emit(act: "stderr", data: string): boolean;

  on(act: "error", fn: (data: Error) => void): this;
  on(act: "close", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  on(act: "stdoutRaw", fn: (data: string) => void): this;
  on(act: "stderrRaw", fn: (data: string) => void): this;
  on(act: "stdout", dn: (data: string) => void): this;
  on(act: "stderr", fn: (data: string) => void): this;

  once(act: "error", fn: (data: Error) => void): this;
  once(act: "close", fn: (data: {code: number, signal: NodeJS.Signals}) => void): this;
  once(act: "stdoutRaw", fn: (data: string) => void): this;
  once(act: "stderrRaw", fn: (data: string) => void): this;
  once(act: "stdout", dn: (data: string) => void): this;
  once(act: "stderr", fn: (data: string) => void): this;
}

export class customChild extends EventEmitter {
  public child: child_process.ChildProcess;
  public kill(signal?: number|NodeJS.Signals) {if(this.child?.killed) return this.child?.killed;return this.child?.kill(signal);}

  public writeStdin(command: string, args?: string[]) {
    let toWrite = command;
    if (args?.length > 0) toWrite += (" "+args.join(" "));
    toWrite+="\n";
    this.child.stdin.write(toWrite);
  }

  constructor(child: child_process.ChildProcess, logStream?: {stdout: WriteStream, stderr?: WriteStream}) {
    super({captureRejections: false});
    this.child = child;
    if (logStream) {
      this.child.stdout.pipe(logStream.stdout);
      if (logStream.stderr) this.child.stderr.pipe(logStream.stderr);
    }
    this.child.on("close", (code, signal) => this.emit("close", {code, signal}));
    this.child.on("exit", (code, signal) => this.emit("close", {code, signal}));
    this.child.on("error", err => this.emit("error", err));
    const stdoutBreak = createInterface(this.child.stdout);
    const stderrBreak = createInterface(this.child.stderr);
    stdoutBreak.on("line", line => this.emit("stdout", line));
    stderrBreak.on("line", line => this.emit("stderr", line));
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