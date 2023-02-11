import type { ObjectEncodingOptions } from "node:fs";
import * as child_process from "node:child_process";
import * as extendFs from "@sirherobrine23/extends";
import path from "node:path";

export type childProcessPromise = {
  code?: number|NodeJS.Signals,
  pid?: number,
  stdout?: Buffer,
  stderr?: Buffer
};

export type execObject<target extends "args"|"noArgs" = "args", T extends {} = {}> = {
  command: string,
  options?: T,
} & (target extends "args" ? {args?: string[]} : {});

export class execError extends Error {
  public exitcode: number;
  public exitSignal: NodeJS.Signals;
  constructor(error: any, exitcode: number, exitSignal: NodeJS.Signals) {
    super(error);
    this.exitcode = exitcode;
    this.exitSignal = exitSignal;
  }
}

export type execFileOptions = ObjectEncodingOptions & child_process.ExecFileOptions;
export type newExecFileOptions = execObject<"args", execFileOptions>;
export async function execFile(command: string, args: string[], options: execFileOptions): Promise<childProcessPromise>;
export async function execFile(command: string, args: string[]): Promise<childProcessPromise>;
export async function execFile(command: string): Promise<childProcessPromise>;
export async function execFile(command: newExecFileOptions): Promise<childProcessPromise>;
export async function execFile(command: string|newExecFileOptions, args?: string[], options?: execFileOptions): Promise<childProcessPromise> {
  if (typeof command === "string") {
    if (!args) args = [];
    if (!options) options = {};
    command = {
      command: command,
      args: args,
      options: options
    };
  }
  const fixedCommand: newExecFileOptions = {options: {}, args: [], ...command};
  if (fixedCommand.options.maxBuffer === undefined) fixedCommand.options.maxBuffer = Infinity;
  fixedCommand.options.env = {...process.env, ...fixedCommand.options?.env};
  fixedCommand.options.encoding = "binary";
  return new Promise<childProcessPromise>((done, reject) => {
    const child = child_process.execFile(fixedCommand.command, fixedCommand.args, fixedCommand.options, (err, stdout: Buffer, stderr: Buffer) => {
      if (err) return reject(new execError(err, child.exitCode, child.exitSignal));
      done({
        code: child.exitCode||child.signalCode,
        pid: child.pid,
        stderr, stdout
      });
    });
  });
}

export type execOptions = child_process.ExecOptions & {encoding?: BufferEncoding};
export type newExecOptions = execObject<"noArgs", execOptions>;
export async function exec(command: string|newExecOptions, options?: execOptions): Promise<childProcessPromise>;
export async function exec(command: string): Promise<childProcessPromise>;
export async function exec(command: newExecOptions): Promise<childProcessPromise>;
export async function exec(command: string|newExecOptions, options?: execOptions): Promise<childProcessPromise> {
  if (typeof command === "string") {
    if (!options) options = {};
    command = {
      command: command,
      options: options
    };
  }
  const fixedCommand: newExecOptions = {options: {}, ...command};
  if (fixedCommand.options.maxBuffer === undefined) fixedCommand.options.maxBuffer = Infinity;
  fixedCommand.options.env = {...process.env, ...fixedCommand.options?.env};
  fixedCommand.options.encoding = "binary";
  return new Promise<childProcessPromise>((done, reject) => {
    const child = child_process.exec(fixedCommand.command, fixedCommand.options, (err, stdout: Buffer, stderr: Buffer) => {
      if (err) return reject(new execError(err, child.exitCode, child.exitSignal));
      done({
        code: child.exitCode||child.signalCode,
        pid: child.pid,
        stderr, stdout
      });
    });
  });
}

export async function commandExists(command: string): Promise<boolean>;
export async function commandExists(command: string, returnBoolean: true): Promise<boolean>;
export async function commandExists(command: string, returnBoolean: false): Promise<string>;
export async function commandExists(command: string, returnBoolean: boolean = true): Promise<string|boolean> {
  let location = "";
  if (path.isAbsolute(command)) {
    if (await extendFs.exists(command)) location = command;
  } else {
    const commandFind: newExecOptions = {command: `command -v "${command}"`};
    if (process.platform === "win32") commandFind.command = `where "${command}"`;
    location = (await exec(commandFind).then(res => res.stdout?.toString("utf8")||res.stderr?.toString("utf8")||"")).trim();
  }
  if (returnBoolean) return !!location
  if (!location) throw new Error("This command not exists or is a shell function");
  return location;
}