import path from "path";
import os from "os";
import { runAsync, runCommandAsync } from "../../childProcess";

export async function startServer() {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), "bedrock");
  const Process: {command: string; args: Array<string>; env: {[env: string]: string};} = {
    command: "",
    args: [],
    env: {...process.env}
  };
  if (process.platform === "darwin") throw new Error("Run Docker image");
    Process.command = path.resolve(ServerPath, "bedrock_server"+(process.platform === "win32"?".exe":""));
    if (process.platform !== "win32") {
      await runAsync("chmod", ["a+x", Process.command]);
      Process.env.LD_LIBRARY_PATH = path.resolve(ServerPath, "bedrock");
      if (process.platform === "linux" && process.arch !== "x64") {
      const existQemu = await runCommandAsync("command -v qemu-x86_64-static").then(() => true).catch(() => false);
      if (existQemu) {
        console.warn("Minecraft bedrock start with emulated x64 architecture");
        Process.args.push(Process.command);
        Process.command = "qemu-x86_64-static";
      }
    }
  }
  // return await execServer({runOn: "host"}, Process.command, Process.args, {env: Process.env, cwd: ServerPath});
  return Process;
}

export function parsePorts(data: string): {port: number; version?: "IPv4"|"IPv6"}|void {
  const portParse = data.match(/(IPv[46])\s+supported,\s+port:\s+(.*)/);
  if (!!portParse) {
    return {
      port: parseInt(portParse[2]),
      version: portParse[1] as "IPv4"|"IPv6"
    };
  }
  return;
}

export function parseUserAction(data: string): {player: string; action: "connect"|"disconnect"|"unknown"; date: Date; xuid?: string;}|void {
  if (/r\s+.*\:\s+.*\,\s+xuid\:\s+.*/gi.test(data)) {
    const actionDate = new Date();
    const [action, player, xuid] = (data.match(/r\s+(.*)\:\s+(.*)\,\s+xuid\:\s+(.*)/)||[]).slice(1, 4);
    const __PlayerAction: {player: string, xuid: string|undefined, action: "connect"|"disconnect"|"unknown"} = {
      player: player,
      xuid: xuid,
      action: "unknown"
    };
    if (action === "connected") __PlayerAction.action = "connect";
    else if (action === "disconnected") __PlayerAction.action = "disconnect";
    return {
      player: __PlayerAction.player,
      action: __PlayerAction.action,
      date: actionDate,
      xuid: __PlayerAction.xuid||undefined
    };
  }
  return;
}