import { extendsFS } from "@sirherobrine23/extends";
import child_process from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

// Default bds maneger core
export const bdsManegerRoot = process.env.bdscoreroot ? path.resolve(process.cwd(), process.env.bdscoreroot) : path.join(os.homedir(), ".bdsmaneger");
if (!(await extendsFS.exists(bdsManegerRoot))) await fs.mkdir(bdsManegerRoot, {recursive: true});

export type runOptions = {
  cwd: string,
  env?: {[k: string]: string|number|boolean},
  command: string,
  args?: (string|number|boolean)[],
  serverActions?: {
    stop?(child: serverRun): void|Promise<void>,
  }
};

export declare class serverRun extends child_process.ChildProcess {
  on(event: string, listener: (...args: any[]) => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
  on(event: "disconnect", listener: () => void): this;
  on(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
  on(event: "message", listener: (message: child_process.Serializable, sendHandle: child_process.SendHandle) => void): this;
  on(event: "spawn", listener: () => void): this;

  once(event: string, listener: (...args: any[]) => void): this;
  once(event: "error", listener: (err: Error) => void): this;
  once(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
  once(event: "disconnect", listener: () => void): this;
  once(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
  once(event: "message", listener: (message: child_process.Serializable, sendHandle: child_process.SendHandle) => void): this;
  once(event: "spawn", listener: () => void): this;

  stopServer(): Promise<{code?: number, signal?: NodeJS.Signals}>;
  sendCommand(...args: (string|number|boolean)[]): this;
}

/**
 *
 */
export async function runServer(options: runOptions): Promise<serverRun> {
  const child = child_process.execFile(options.command, [...((options.args ?? []).map(String))], {
    maxBuffer: Infinity,
    cwd: options.cwd || process.cwd(),
    env: {
      ...process.env,
      ...Object.keys(options.env ?? {}).reduce((acc, a) => {
        acc[a] = String(options.env[a]);
        return acc;
      }, {})
    }
  }) as serverRun;
  child.sendCommand = function (...args) {
    if (!child.stdin.writable) {
      child.emit("error", new Error("cannot send command to server"));
      return child;
    };
    child.stdin.write(args.map(String).join(" ")+"\n");
    return child;
  }

  child.stopServer = async function () {
    const stop = options.serverActions?.stop ?? function (child) {

    };
    Promise.resolve().then(() => stop(child)).catch(err => child.emit("error", err));
    return new Promise((done, reject) => child.once("error", reject).once("exit", (code, signal) => done({code, signal})));
  }
  return child;
}

export type manegerOptions = {
  ID?: string,
  newID?: boolean,
};

/**
 *
 */
export async function serverManeger(options: manegerOptions) {
  if (!options) throw new TypeError("Por favor adicione as opções do serverManeger!");
  if (!options.ID) options.newID = true;
  if (options.newID) {
    while(true) {
      options.ID = crypto.randomBytes(16).toString("hex");
      if (!(await fs.readdir(bdsManegerRoot)).includes(options.ID)) break;
    }
  }

  /**
   * Platform ID root path
   */
  const rootPath = path.join(bdsManegerRoot, options.ID);
  if (!(await extendsFS.exists(rootPath))) await fs.mkdir(rootPath, {recursive: true});

  // sub-folders
  const serverFolder = path.join(rootPath, "server");
  const backup = path.join(rootPath, "backups");

  for await (const p of [
    serverFolder,
    backup,
  ]) if (!(await extendsFS.exists(p))) await fs.mkdir(p, {recursive: true});

  return {
    id: options.ID,
    rootPath,
    serverFolder,
    backup,
    async runCommand(options: Omit<runOptions, "cwd">) {
      return runServer({...options, cwd: serverFolder});
    }
  };
}

export type serverManegerV1 = Awaited<ReturnType<typeof serverManeger>>;