import extendFs from "@sirherobrine23/extends";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";
import { createSSHKey } from "./db.js";
import { randomUUID } from "node:crypto";

export type configSchema = {
  port: number;
  cookieSecret: string;
  sshServer: {
    hostKeys: string[];
    port?: number;
    banner?: string;
  };
  mongo?: {
    uri: string;
    databaseName?: string;
  }
};

export async function getConfig() {
  const configPath = path.resolve(process.cwd(), process.env.CONFIG_PATH || "./config.yml");
  let userConfig: configSchema|undefined;
  const config: configSchema = {
    port: Number(process.env.PORT || "3000"),
    cookieSecret: process.env.COOKIE_SECRET || randomUUID(),
    mongo: {
      uri: process.env.MONGO_URI || "mongodb://127.0.0.1",
      databaseName: process.env.DB_NAME || "bdsWeb"
    },
    sshServer: {
      hostKeys: [
        (await createSSHKey()).private,
      ]
    },
  };

  if (await extendFs.exists(configPath))  {
    userConfig = yaml.parse(await fs.readFile(configPath, "utf8"));
    if (typeof userConfig.port === "number" && userConfig.port >= 0) config.port = userConfig.port;
    if (typeof userConfig.cookieSecret === "string") config.cookieSecret = userConfig.cookieSecret;
    if (typeof userConfig.mongo === "object" && !(Array.isArray(userConfig.mongo))) {
      if (typeof userConfig.mongo.databaseName === "string") config.mongo.databaseName = userConfig.mongo.databaseName;
      if (typeof userConfig.mongo.uri === "string") config.mongo.uri = userConfig.mongo.uri;
    }
    if (typeof userConfig.sshServer === "object" && !(Array.isArray(userConfig.sshServer))) {
      if (typeof userConfig.sshServer.banner === "string") config.sshServer.banner = userConfig.sshServer.banner;
      if (typeof userConfig.sshServer.port === "number" && userConfig.sshServer.port >= 0) config.sshServer.port = userConfig.sshServer.port;
      if (Array.isArray(userConfig.sshServer.hostKeys) && userConfig.sshServer.hostKeys.length > 0) config.sshServer.hostKeys = userConfig.sshServer.hostKeys;
    }
  }

  await fs.writeFile(configPath, yaml.stringify(config));
  return config;
}

export const config = await getConfig();