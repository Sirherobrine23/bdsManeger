import path from "path";
import os from "os";
import crypto from "crypto";
import child_process from "child_process";

type Session = {
  startDate: Date;
  on: (from: "stdout"|"stderr", callback: (data: string) => void) => void;
  exit: (callback: (code: number, signal: string) => void) => void;
  commands: {
    tpPlayer: (username: string, x: number, y: number, z: number) => void;
    execCommand: (command: string) => void;
  }
};

const Sessions: {[Session: string]: Session} = {};
export async function getSessions() {return Sessions;}

export function Start(Platform: "bedrock"|"java"|"pocketmine"|"spigot"|"dragonfly"): Session {
  const ServerPath = path.resolve(process.env.SERVERPATH||path.join(os.homedir(), "bds_core"));
  const Process: {command: string; args: Array<string>; env: {[env: string]: string}; cwd: string;} = {
    command: "",
    args: [],
    env: {...process.env},
    cwd: process.cwd()
  };
  if (Platform === "bedrock") {
    if (process.platform === "darwin") throw new Error("Run Docker image");
    Process.command = path.resolve(ServerPath, "bedrock/bedrock"+(process.platform === "win32"?".exe":""));
    if (process.platform !== "win32") {
      child_process.execFileSync("chmod", ["a+x", Process.command]);
      Process.env.LD_LIBRARY_PATH = path.resolve(ServerPath, "bedrock");
      if (process.arch !== "x64") {
        console.warn("Minecraft bedrock start with emulated x64 architecture");
        Process.args.push(Process.command);
        Process.command = "qemu-x86_64-static";
      }
    }
  } else if (Platform === "java"||Platform === "spigot") {
    Process.command = "java";
    Process.args.push("-jar");
    if (Platform === "java") Process.args.push(path.resolve(ServerPath, "java/Server.jar"));
    else Process.args.push(path.resolve(ServerPath, "spigot/Spigot.jar"));
  } else if (Platform === "pocketmine") {
    if (process.platform === "win32") Process.command = path.resolve(ServerPath, "pocketmine/bins/php/php");
    else Process.command = path.resolve(ServerPath, "pocketmine/bins/php7/bin/php");
    Process.args.push(path.resolve(ServerPath, "pocketmine/PocketMine-MP.phar"));
  }

  // Start Server
  const ServerProcess = child_process.execFile(Process.command, Process.args, {env: Process.env, cwd: Process.cwd, maxBuffer: Infinity});
  const StartDate = new Date();

  // Log callback
  const onLog = (from: "stdout"|"stderr", callback: (data: string) => void) => {
    ServerProcess[from].on("data", callback);
    return;
  }

  // Exit callback
  const onExit = (callback: (code: number, signal: string) => void): void => {
    ServerProcess.on("exit", callback);
  }

  // Run Command
  const execCommand = (...command) => {
    ServerProcess.stdin.write(command.join(" ")+"\n");
    return;
  };

  // Teleport player
  const tpPlayer = (username: string, x: number, y: number, z: number) => {
    execCommand("tp", username, x, y, z);
    return;
  }

  // Return Session
  const Seesion = {
    id: crypto.randomUUID(),
    startDate: StartDate,
    on: onLog,
    exit: onExit,
    commands: {
      execCommand: execCommand,
      tpPlayer: tpPlayer,
    }
  };
  Sessions[Seesion.id] = Seesion;
  return Seesion;
}