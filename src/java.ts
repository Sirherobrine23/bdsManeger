import path from "node:path";
import fs from "node:fs/promises";
import fsOld from "node:fs";
import os from "node:os";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { actions, actionConfig } from "./globalPlatfroms";
import { saveFile } from "./httpRequest";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
// export const serverPath = path.join(serverRoot, "java");

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("java", platformOptions);
  const jarPath = path.join(serverPath, "server.jar");
  return platformManeger.java.find(version).then(release => saveFile(release.url, {filePath: jarPath}).then(() => release));
}

export const started = /\[.*\].*\s+Done\s+\(.*\)\!.*/;
export const portListen = /\[.*\]:\s+Starting\s+Minecraft\s+server\s+on\s+(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[A-Za-z0-9]+|\*):([0-9]+))/;
export const playerAction = /\[.*\]:\s+([\S\w]+)\s+(joined|left|lost)/;
const serverConfig: actionConfig[] = [
  {
    name: "serverStop",
    run: (child) => child.runCommand("stop")
  },
  {
    name: "serverStarted",
    callback(data, done) {
      // [22:35:26] [Server thread/INFO]: Done (6.249s)! For help, type "help"
      if (started.test(data)) done(new Date());
    }
  },
  {
    name: "portListening",
    callback(data, done) {
      const portParse = data.match(portListen);
      if (!portParse) return;
      let [,, host, port] = portParse;
      if (host === "*"||!host) host = "127.0.0.1";
      done({
        port: parseInt(port),
        type: "TCP",
        host: host,
        protocol: "IPV4/IPv6"
      });
    }
  },
  {
    name: "playerAction",
    callback(data, playerConect, playerDisconnect, playerUnknown) {
      if (playerAction.test(data)) {
        const [, playerName, action] = data.match(data)||[];
        if (action === "joined") playerConect({playerName, connectTime: new Date()});
        else if (action === "left") playerDisconnect({playerName, connectTime: new Date()});
        else if (action === "lost") playerUnknown({playerName, connectTime: new Date(), action: "lost"});
        else playerUnknown({playerName, connectTime: new Date()});
      }
    },
  },
];

export async function startServer(Config?: {maxMemory?: number, minMemory?: number, maxFreeMemory?: boolean, platformOptions?: bdsPlatformOptions}) {
  const { serverPath, logsPath } = await pathControl("java", Config?.platformOptions||{id: "default"});
  const jarPath = path.join(serverPath, "server.jar");
  if (!fsOld.existsSync(jarPath)) throw new Error("Install server fist.");
  const command = "java";
  const args = ["-jar"];
  if (Config) {
    if (Config.maxFreeMemory) {
      const safeFree = Math.floor(os.freemem()/1e6)-512;
      if (safeFree > 1000) args.push(`-Xms${safeFree}m`);
      else console.warn("There is little ram available!")
    } else {
      if (Config.minMemory) args.push(`-Xms${Config.minMemory}m`);
      if (Config.maxMemory) args.push(`-Xmx${Config.maxMemory}m`);
    }
  }
  args.push(jarPath, "nogui");
  const eula = path.join(serverPath, "eula.txt");
  await fs.writeFile(eula, (await fs.readFile(eula, "utf8").catch(() => "eula=false")).replace("eula=false", "eula=true"));
  const logFileOut = path.join(logsPath, `${Date.now()}_${process.platform}_${process.arch}.log`);
  return new actions({
    processConfig: {command, args, options: {cwd: serverPath, maxBuffer: Infinity, logPath: {stdout: logFileOut}}},
    hooks: serverConfig
  });
}
