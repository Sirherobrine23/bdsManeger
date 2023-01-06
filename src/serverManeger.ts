import { createInterface as readline } from "node:readline";
import { promises as fs } from "node:fs";
import child_process, { ChildProcess } from "node:child_process";
import { extendFs } from "@sirherobrine23/coreutils";
import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";

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

export type serverConfig = {
  exec: {
    exec: string,
    args?: string[],
    cwd?: string,
    env?: NodeJS.ProcessEnv & {[key: string]: string},
  },
  actions: {
    stopServer?: (child_process: ChildProcess) => void,
    onStart?: (lineData: string, fnRegister: (data: {serverAvaible: Date, bootUp?: number}) => void) => void,
    playerActions?: (lineData: string, fnRegister: (data: {player: string, action: "join" | "leave"}) => void) => void,
  }
};

export async function serverManeger(serverOptions: serverConfig) {
  const serverExec = child_process.execFile(serverOptions.exec.exec, serverOptions.exec.args ?? [], {
    cwd: serverOptions.exec.cwd,
    env: {
      ...process.env,
      ...serverOptions.exec.env
    },
    windowsHide: true,
    maxBuffer: Infinity
  });
  const stdoutReadline = readline({input: serverExec.stdout});
  const stderrReadline = readline({input: serverExec.stderr});

  return {
    serverExec,
    stdoutReadline,
    stderrReadline
  };
}