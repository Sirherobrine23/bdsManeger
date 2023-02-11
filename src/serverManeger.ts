import { createInterface as readline } from "node:readline";
import { promises as fs } from "node:fs";
import child_process from "node:child_process";
import { Cloud, Extends as extendFs } from "@sirherobrine23/coreutils";
import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";
import EventEmitter from "node:events";

export type pathOptions = {
  id?: "default"|string,
  newId?: boolean,
  withBuildFolder?: boolean,
};

export let bdsRoot = process.env.BDS_HOME?(process.env.BDS_HOME.startsWith("~")?process.env.BDS_HOME.replace("~", os.homedir()):process.env.BDS_HOME):path.join(os.homedir(), ".bdsManeger");
export async function platformPathID(platform: "bedrock"|"java", options?: pathOptions) {
  if (!(["bedrock", "java"].includes(platform))) throw new Error("Invalid platform target");
  options = {id: "default", ...options};
  const platformRoot = path.join(bdsRoot, platform);
  if (!await extendFs.exists(platformRoot)) await fs.mkdir(platformRoot, {recursive: true});
  if (!options) options = {};

  // Create if not exists
  const foldersAndLink = await fs.readdir(platformRoot);
  if (foldersAndLink.length === 0) options.newId = true;
  if (options.newId) {
    options.id = crypto.randomBytes(16).toString("hex");
    fs.mkdir(path.join(platformRoot, options.id), {recursive: true});
    if (await extendFs.exists(path.join(platformRoot, "default"))) await fs.unlink(path.join(platformRoot, "default"));
    await fs.symlink(path.join(platformRoot, options.id), path.join(platformRoot, "default"));
  } else if (!await extendFs.exists(path.join(platformRoot, options.id))) throw new Error("Folder ID not created!");

  // Get real id
  if (!(/^[A-Za-z0-9]*$/).test(options.id)) throw new Error("Invalid Platform ID");
  if (options?.id === "default") options.id = path.basename(await fs.realpath(path.join(platformRoot, options.id)).catch(async () => (await fs.readdir(platformRoot)).sort().at(0)));

  // Mount Paths
  const serverRoot = path.join(platformRoot, options.id);
  const serverPath = path.join(serverRoot, "server");
  const hooksPath = path.join(serverRoot, "hooks");
  const backupPath = path.join(serverRoot, "backup");
  const logsPath = path.join(serverRoot, "logs");
  let buildFolder: string;
  if (options?.withBuildFolder) buildFolder = path.join(serverRoot, "build");

  // Create folder if not exists
  if (!(await extendFs.exists(serverRoot))) await fs.mkdir(serverRoot, {recursive: true});
  if (!(await extendFs.exists(serverPath))) await fs.mkdir(serverPath, {recursive: true});
  if (!(await extendFs.exists(hooksPath))) await fs.mkdir(hooksPath, {recursive: true});
  if (!(await extendFs.exists(backupPath))) await fs.mkdir(backupPath, {recursive: true});
  if (!(await extendFs.exists(logsPath))) await fs.mkdir(logsPath, {recursive: true});
  if (buildFolder && !(await extendFs.exists(buildFolder))) await fs.mkdir(buildFolder, {recursive: true});

  return {
    id: options?.id,
    serverRoot,
    serverPath,
    hooksPath,
    backupPath,
    logsPath,
    buildFolder,
    platformIDs: foldersAndLink
  };
}

export type playerAction = ({action: "join"|"spawned"|"leave"}|{
  action: "kick"|"ban",
  reason?: string,
  by?: string
}) & {
  player: string,
  actionDate: Date,
  sessionID: string
  more?: any,
  latestAction?: playerAction
}

export type serverConfig = {
  exec: {
    exec?: string,
    args?: string[],
    cwd?: string,
    env?: NodeJS.ProcessEnv & {[key: string]: string},
  },
  actions?: {
    stopServer?: (child_process: child_process.ChildProcess) => void,
    onStart?: (lineData: string, fnRegister: (data?: {serverAvaible?: Date, bootUp?: number}) => void) => void,
    playerActions?: (lineData: string, fnRegister: (data: playerAction) => void) => void,
  },
  maneger?: {
    backup?: {
      folderWatch: {local: string, remoteParent?: string}[],
    } & ({
      cloud: "google",
      config: Cloud.googleOptions
    }|{
      cloud: "oracle_bucket",
      config: Cloud.oracleOptions
    })
  }
};

declare class serverManeger extends EventEmitter {
  on(event: "error", fn: (lineLog: any) => void): this;
  once(event: "error", fn: (lineLog: any) => void): this;
  emit(event: "error", data: any): boolean;

  on(event: "log", fn: (lineLog: string) => void): this;
  once(event: "log", fn: (lineLog: string) => void): this;
  emit(event: "log", data: string): boolean;

  on(event: "rawLog", fn: (raw: any) => void): this;
  once(event: "rawLog", fn: (raw: any) => void): this;
  emit(event: "rawLog", data: any): boolean;

  // Player actions
  on(event: "playerAction", fn: (playerAction: playerAction) => void): this;
  once(event: "playerAction", fn: (playerAction: playerAction) => void): this;
  emit(event: "playerAction", data: playerAction): boolean;

  // Server started
  on(event: "serverStarted", fn: (data: {serverAvaible: Date, bootUp: number}) => void): this;
  once(event: "serverStarted", fn: (data: {serverAvaible: Date, bootUp: number}) => void): this;
  emit(event: "serverStarted", data: {serverAvaible: Date, bootUp: number}): boolean;
}

export async function createServerManeger(serverOptions: serverConfig): Promise<serverManeger> {
  const internalStops: (() => any|void)[] = [];
  if (serverOptions?.maneger?.backup) {
    const { folderWatch, cloud } = serverOptions?.maneger?.backup;
    if (cloud === "oracle_bucket") {
      const { config } = serverOptions?.maneger?.backup;
      const ociClient = await Cloud.oracleBucket(config);
      for await (const folder of folderWatch) {
        ociClient;
        folder;
      }
    }
  }
  const serverExec = child_process.execFile(serverOptions.exec.exec, serverOptions.exec.args ?? [], {
    cwd: serverOptions.exec.cwd,
    windowsHide: true,
    maxBuffer: Infinity,
    env: {
      ...process.env,
      ...serverOptions.exec.env
    },
  });
  const playerActions: playerAction[] = [];
  const internalEvent = new class serverManeger extends EventEmitter {
    async stopServer() {
      const stopServer = serverOptions.actions?.stopServer ?? ((child_process) => child_process.kill("SIGKILL"));
      await Promise.resolve(stopServer(serverExec)).catch(err => internalEvent.emit("error", err));
      internalStops.forEach((fn) => Promise.resolve().then(() => fn()).catch(err => internalEvent.emit("error", err)));
    }

    getPlayers() {
      return playerActions ?? [];
    }
  };
  serverExec.on("error", internalEvent.emit.bind(internalEvent, "error"));
  const stdoutReadline = readline({input: serverExec.stdout});
  stdoutReadline.on("line", (line) => internalEvent.emit("log", line));
  stdoutReadline.on("error", internalEvent.emit.bind(internalEvent, "error"));
  serverExec.stdout.on("data", (data) => internalEvent.emit("rawLog", data));

  const stderrReadline = readline({input: serverExec.stderr});
  stderrReadline.on("line", (line) => internalEvent.emit("log", line));
  stderrReadline.on("error", internalEvent.emit.bind(internalEvent, "error"));
  serverExec.stderr.on("data", (data) => internalEvent.emit("rawLog", data));

  // Server start
  if (serverOptions.actions?.onStart) {
    const serverStartFN = serverOptions.actions.onStart;
    let lock = false;
    const started = new Date();
    async function register(data?: {serverAvaible?: Date, bootUp?: number}) {
      if (lock) return;
      const eventData = {
        serverAvaible: data?.serverAvaible ?? new Date(),
        bootUp: data?.bootUp ?? new Date().getTime() - started.getTime()
      };
      internalEvent.emit("serverStarted", eventData);
      lock = true;
      stderrReadline.removeListener("line", register);
      stdoutReadline.removeListener("line", register);
      // emit and remove new listener for serverStarted
      internalEvent.removeAllListeners("serverStarted");
      internalEvent.prependListener("serverStarted", () => {
        internalEvent.emit("serverStarted", eventData);
        internalEvent.removeAllListeners("serverStarted");
      });
    }
    stdoutReadline.on("line", (line) => serverStartFN(line, register));
    stderrReadline.on("line", (line) => serverStartFN(line, register));
  }

  // Player actions
  if (serverOptions.actions?.playerActions) {
    const playerFn = serverOptions.actions.playerActions;
    const registerData = (data: playerAction) => {
      const player = playerActions.find((player) => player.player === data.player);
      if (!player) playerActions.push(data);
      else {
        data.latestAction = player;
        playerActions[playerActions.indexOf(player)] = data;
      }
      internalEvent.emit("playerAction", data);
    }
    stdoutReadline.on("line", (line) => playerFn(line, registerData));
    stderrReadline.on("line", (line) => playerFn(line, registerData));
  }

  return internalEvent;
}