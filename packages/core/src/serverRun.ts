import { extendsFS } from "@sirherobrine23/extends";
import child_process from "node:child_process";
import EventEmitter from "node:events";
import { createWriteStream, promises as fs } from "node:fs";
import { createInterface as readline } from "node:readline";
import path from "node:path";
import stream from "node:stream";
import tar from "tar";

export interface ManegerOptions {
  rootPath: string;
  runServer: {
    command: string;
    args?: (string | number | boolean)[];
    env?: Map<string, string | number | boolean> | { [K: string]: string | number | boolean },
    stdio?: child_process.StdioPipeNamed | child_process.StdioPipe[];
  };
};

type EventMap = Record<string, (...args: any[]) => void>;
type EventKey<T extends EventMap> = string & keyof T;
export type defaultEvents = {
  "onServerSpawn": (child: child_process.ChildProcess) => void;
}

/**
 * Extens
 */
export class serverManeger<T extends EventMap = {}> extends EventEmitter {
  #io: ManegerOptions;
  #serverStorage: string;
  #logStorage: string;
  constructor(options: ManegerOptions) {
    super({ captureRejections: true });
    this.#io = options;
    this.#io.rootPath = path.resolve(process.cwd(), this.#io.rootPath);
    this.#serverStorage = path.join(this.#io.rootPath, "storage");
    this.#logStorage = path.join(this.#io.rootPath, "logs");
  }

  on<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  on<K extends EventKey<defaultEvents>>(eventName: K, fn: defaultEvents[K]): this;
  on(eventName: "line", fn: (line: string) => void): this;
  on(eventName: "error", fn: (err: Error) => void): this;
  on(eventName: string, fn: (...args: any) => void): this {
    super.on(eventName, fn);
    return this;
  }

  once<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  once<K extends EventKey<defaultEvents>>(eventName: K, fn: defaultEvents[K]): this;
  once(eventName: "line", fn: (line: string) => void): this;
  once(eventName: "error", fn: (err: Error) => void): this;
  once(eventName: string, fn: (...args: any) => void): this {
    super.once(eventName, fn);
    return this;
  }

  emit<K extends EventKey<T>>(eventName: K, ...args: Parameters<T[K]>): boolean;
  emit<K extends EventKey<defaultEvents>>(eventName: K, ...args: Parameters<defaultEvents[K]>): boolean;
  emit(name: "line", line: string): boolean;
  emit(name: "error", err: Error): boolean;
  emit(eventName: string, ...args: any): boolean {
    return super.emit(eventName, args);
  }

  /** Get root from paths */
  getRoot(): string { return this.#io.rootPath; };

  /**
   * Create tar.gz from server Storage, if server running create "snapshot" from server running state.
   *
   * @returns - Gzip tar
   */
  hotBackup(): stream.Readable {
    return tar.create({
      gzip: true,
      cwd: this.#serverStorage
    }, []);
  }

  #severProcess: child_process.ChildProcess;
  getStdout() {
    return this.#severProcess.stdout;
  }

  getStderr() {
    return this.#severProcess.stderr;
  }

  getStdin() {
    return this.#severProcess.stdin;
  }

  /**
   * Start server
   *
   * @returns get from server actions
   */
  async startServer() {
    if (this.#severProcess) return;
    let processEnv: { [k: string]: string } = {};
    if (this.#io.runServer.env) {
      const { env } = this.#io.runServer;
      if (env instanceof Map) {
        processEnv = Array.from(env.keys()).reduce<typeof processEnv>((acc, keyName) => {
          if (env.get(keyName) !== undefined) acc[keyName] = String(env.get(keyName));
          return acc;
        }, {});
      } else {
        processEnv = Object.keys(env).reduce<typeof processEnv>((acc, keyName) => {
          if (env[keyName] !== undefined) acc[keyName] = String(env[keyName]);
          return acc;
        }, {});
      }
    }

    const runDate = new Date();
    this.#severProcess = child_process.spawn(this.#io.runServer.command, (this.#io.runServer.args || []).map(String), {
      env: { ...process.env, ...processEnv },
      cwd: this.#serverStorage,
      stdio: this.#io.runServer.stdio,
    });

    const logPath = path.join(this.#logStorage, String(runDate.getFullYear()), String(runDate.getMonth() + 1), String(runDate.getDate()));
    const logpathRoot = createWriteStream(path.join(this.#logStorage, "all.log"));
    if (!(await extendsFS.exists(logPath))) await fs.mkdir(logPath, {recursive: true});
    if (this.#severProcess.stdout) {
      this.#severProcess.stdout.pipe(createWriteStream(path.join(logPath, "stdout.log")));
      this.#severProcess.stdout.pipe(logpathRoot);
      readline(this.#severProcess.stdout).on("line", line => this.emit("line", line));
    }

    if (this.#severProcess.stderr) {
      this.#severProcess.stderr.pipe(createWriteStream(path.join(logPath, "stderr.log")));
      this.#severProcess.stderr.pipe(logpathRoot);
      readline(this.#severProcess.stderr).on("line", line => this.emit("line", line));
    }

    this.emit("onServerSpawn", this.#severProcess);
  }
};