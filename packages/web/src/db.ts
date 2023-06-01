import { extendsFS } from "@sirherobrine23/extends";
import { bdsManegerRoot, runOptions, runServer, serverManegerV1 } from "@the-bds-maneger/core";
import { MongoClient } from "mongodb";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";
import { getConfig } from "./config.js";
import { uniqueNamesGenerator, names, colors, animals, adjectives } from "unique-names-generator";

const config = await getConfig();
export const client = await (new MongoClient(config.mongo.uri)).connect();
export const database = client.db(config.mongo.databaseName);

export type userPermission = "root" | "admin" | "confirm";
export type userCollection = {
  ID: string;
  createAt: Date;
  email: string;
  password: {
    salt: string;
    hash: string;
  };
  username: string;
  permissions: userPermission[];
  tokens: string[];
  sshKeys: {
    private: string;
    public: string;
  }[];
};

export const userCollection = database.collection<userCollection>("user");

export async function createToken() {
  let token: string;
  function bufToChar(buf: Buffer) {
    let str: string = "";
    for (let i = 0; buf.length > i; i++) {
      if ((/[a-zA-Z0-9]/).test(String.fromCharCode(buf[i]))) str += String.fromCharCode(buf[i]);
      else str += crypto.randomInt(2, 20000);
    }
    return str;
  }
  while (true) {
    if (await userCollection.findOne({ tokens: [(token = "tk_" + bufToChar(crypto.randomBytes(16)))] })) continue;
    break;
  }
  return token;
}

export async function createSSHKey() {
  const generateKeyPair = util.promisify(crypto.generateKeyPair);
  return generateKeyPair("rsa", {
    modulusLength: 3072,
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs1"
    },
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem"
    }
  }).then(a => ({ private: String(a.privateKey), public: String(a.publicKey) }));
}

export async function passworldSc(input: string): Promise<{ hash: string, salt: string }> {
  const iv = crypto.randomBytes(16);
  const secret = crypto.randomBytes(24);
  return new Promise((done, reject) => {
    crypto.scrypt(secret, "salt", 24, (err, key) => {
      if (err) return reject(err);
      const cipher = crypto.createCipheriv("aes-192-cbc", key, iv);
      cipher.on("error", reject);
      return done({
        hash: Buffer.from(cipher.update(input, "utf8", "hex") + cipher.final("hex"), "utf8").toString("base64"),
        salt: Buffer.from(iv.toString("hex") + "::::" + secret.toString("hex"), "utf8").toString("base64")
      });
    });
  });
}

export async function passworldDc(hash: string, salt: string): Promise<string> {
  const hashSplit = Buffer.from(salt, "base64").toString("utf8").split("::::");
  return new Promise((done, reject) => {
    const iv = Buffer.from(hashSplit.at(0), "hex");
    const secret = Buffer.from(hashSplit.at(1), "hex");
    crypto.scrypt(secret, "salt", 24, (err, key) => {
      if (err) return reject(err);
      const decipher = crypto.createDecipheriv("aes-192-cbc", key, iv);
      decipher.on("error", reject);
      return done(decipher.update(Buffer.from(hash, "base64").toString(), "hex", "utf8") + decipher.final("utf8"));
    });
  });
}

export async function passwordCheck(info: userCollection, password: string) {
  const { password: { hash, salt } } = info;
  return (await passworldDc(hash, salt)) === password;
}

export type serverDB = {
  ID: string;
  platform: serverManegerV1["platform"];
  name: string;
  users: string[];
};

export const serveCollection = database.collection<serverDB>("server");
export const serversIDs = serveCollection;

export async function getServerPaths(ID: string): Promise<serverManegerV1> {
  const info = await serveCollection.findOne({ ID });
  if (!(info)) throw new Error("Server not exists!");

  const rootPath = path.join(bdsManegerRoot, info.platform, ID);
  const serverFolder = path.join(rootPath, "server");
  const backup = path.join(rootPath, "backups");
  const log = path.join(rootPath, "logs");

  // Create folders
  for (const p of [serverFolder, backup, log]) if (!(await extendsFS.exists(p))) await fs.mkdir(p, { recursive: true });

  return {
    id: ID,
    platform: info.platform,
    rootPath,
    serverFolder,
    backup,
    logs: log,
    async runCommand(options: Omit<runOptions, "cwd">) {
      return runServer({
        ...options,
        cwd: serverFolder
      });
    }
  };
}

export async function createServerID(platform: serverManegerV1["platform"], usersIds: string[] = []): Promise<serverManegerV1> {
  if (!((["bedrock", "java"]).includes(platform))) throw new Error("Set valid platform name!");

  // Create Server ID
  let ID: string;
  while (true) {
    if (await userCollection.findOne({ ID: (ID = crypto.randomUUID().split("-").join("_")) })) continue;
    else if (await extendsFS.exists(path.join(bdsManegerRoot, platform, ID))) continue;
    break;
  }

  // Insert
  await serveCollection.insertOne({
    ID,
    name: uniqueNamesGenerator({dictionaries: [ names, colors, animals, adjectives ]}),
    platform,
    users: []
  });

  // If seted user inject to DB
  if (usersIds && usersIds.length > 0) await serveCollection.findOneAndUpdate({ ID }, { $set: { users: usersIds } });

  return getServerPaths(ID);
}