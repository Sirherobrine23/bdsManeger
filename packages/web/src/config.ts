import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createSSHKey } from "./auth.js";
import { homedir } from "node:os";

export type configFile = {
  serversPath: string;
  /** HTTP port listen */
  portListen: number;
  /** Super cookie secret */
  cookieSecret: string;
  /** MongoDB URI connection */
  mongoConnection: string;
  mongoDatabase?: string;
  /** SSH Server config */
  ssh?: {
    port: number;
    hostKeys: string[];
  };
};

const sshKeys = Object.keys(process.env).filter(name => name.startsWith("SSH_HOST")).map(name => path.resolve(process.cwd(), process.env[name]));

export const localConfig: configFile = {
  serversPath: process.env.SERVER_PATH ? path.resolve(process.cwd(), process.env.SERVER_PATH) : path.join(homedir(), ".bdsManeger"),
  cookieSecret: process.env.COOKIE_SECRET || randomBytes(8).toString("hex"),
  mongoConnection: process.env.MONGO_URI || "mongodb://127.0.0.1",
  mongoDatabase: (typeof process.env.MONGO_DB === "string" && process.env.MONGO_DB.length >= 2) ? process.env.MONGO_DB : undefined,
  portListen: Number(process.env.PORT || 3000),
  ssh: {
    port: Number(process.env.SSH_PORT || 3001),
    hostKeys: sshKeys.length > 0 ? await Promise.all(sshKeys.map(async path => fs.readFile(path, "utf8"))) : [ (await createSSHKey()).privateKey ]
  }
};