import session from "express-session";
import express from "express";
import crypto from "node:crypto";
import { localConfig } from "./config.js";
import { mongoDatabase } from "./databaseConnect.js";

declare module "express-session" {
  interface SessionData {
    userID: string;
  }
}

const cookieCollection = mongoDatabase.collection<{sid: string, session: session.SessionData}>("cookies");
class SessionMongo extends session.Store {
  /* temporary storage session on sync to Database */
  readonly tmpSession = new Map<string, session.SessionData>();

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      cookieCollection.findOneAndDelete({sid});
      if (this.tmpSession.has(sid)) this.tmpSession.delete(sid);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: session.SessionData, callback?: (err?: any) => void) {
    if (this.tmpSession.has(sid)) return callback();
    this.tmpSession.set(sid, session);
    session = typeof session["toJSON"] === "function" ? session["toJSON"]() : session;
    try {
      if (await cookieCollection.findOne({sid})) await cookieCollection.findOneAndUpdate({sid}, {session});
      else await cookieCollection.insertOne({sid, session});
      this.tmpSession.delete(sid);
    } catch (err) {
      callback(err);
    }
  }

  async get(sid: string, callback: (err?: any, session?: session.SessionData) => void) {
    if (this.tmpSession.has(sid)) return callback(null, this.tmpSession.get(sid));
    try {
      await cookieCollection.findOne({sid}).then(res => !res ? callback() : callback(null, res.session));
    } catch (err) {
      callback(err, null);
    }
  }

  async clear(callback?: (err?: any) => void) {
    try {
      await cookieCollection.deleteMany({});
      this.tmpSession.clear();
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async all(callback: (err?: any, obj?: session.SessionData[] | { [sid: string]: session.SessionData; }) => void) {
    try {
      await cookieCollection.find({}).toArray().then(cookies => callback(null, cookies.reduce((acc, cookie) => {acc[cookie.sid] = cookie.session; return acc;}, {})), err => callback(err));
    } catch (err) {
      callback(err);
    }
  }
}

export const cookie = session({
  secret: localConfig.cookieSecret,
  name: "bdsAuth",
  saveUninitialized: true,
  resave: true,
  unset: "destroy",
  cookie: {
    httpOnly: false,
    secure: false,
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 30 * 2,
  },
  store: new SessionMongo(),
});

export async function passwordEncrypt(input: string): Promise<{hash: string, salt: string}> {
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

export async function passwordDecrypt(hash: string, salt: string): Promise<string> {
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

export async function createSSHKey(): Promise<{privateKey: string, publicKey: string}> {
  return new Promise((done, reject) => {
    crypto.generateKeyPair("rsa", {
      modulusLength: 3072,
      privateKeyEncoding: {
        format: "pem",
        type: "pkcs1"
      },
      publicKeyEncoding: {
        type: "pkcs1",
        format: "pem"
      }
    }, (err, publicKey: string, privateKey: string) => {
      if (err) return reject(err);
      done({
        privateKey,
        publicKey
      });
    });
  });
}

type userStorage = {
  /** Unique user ID */
  readonly userID: string;

  /** User create date */
  readonly createAt: Date;

  /** Email to auth */
  email: string;

  /** Auth password */
  password: {hash: string, salt: string};

  /** API Token auth */
  tokens: string[];

  /** Minecraft username to maneger access list */
  mcUsername: {
    Bedrock: string;
    Java: string;
  };
};
export const usersCollection = mongoDatabase.collection<userStorage>("usersAuth");

export const random = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return ([
    crypto.randomBytes(8).toString("hex"),
    crypto.randomBytes(4).toString("hex"),
    crypto.randomBytes(4).toString("hex"),
    crypto.randomBytes(4).toString("hex"),
    crypto.randomBytes(12).toString("hex"),
  ]).join("-");
}

export async function generateUserID() {
  let userID: string;
  while (true) if (!(await usersCollection.findOne({userID: (userID = random())}))) break;
  return userID;
}

export async function generateToken() {
  const genToken = () => {
    let data = Array(crypto.randomInt(3, 8)+1).fill(null).map(() => crypto.randomBytes(crypto.randomInt(1, 6)).toString("hex"));
    let scg =  "tk_";

    scg += data.shift() + data.pop();
    scg += "0" + data.join("-")

    return scg;
  };

  let token: string;
  while (true) if (!(await usersCollection.findOne({tokens: [(token = genToken())]}))) break;
  return token;
}

declare module "express-serve-static-core" {
  interface Request {
    userInfo?: userStorage;
  }
}

export const authRoute: express.RequestHandler = async (req, res, next) => {
  if (typeof req.headers.authorization === "string" && (req.headers.authorization = req.headers.authorization.trim()).length > 0) {
    let userInfo: userStorage;
    const { authorization } = req.headers;
    if (authorization.startsWith("Basic ")) {
      const decode64 = Buffer.from(authorization.slice(5).trim(), "base64").toString("utf8");
      let index: number, email = decode64.slice(0, (index = decode64.indexOf(":"))), password = decode64.slice(index+1);
      userInfo = await usersCollection.findOne({email});
      if (await passwordDecrypt(userInfo.password.hash, userInfo.password.salt) !== password) userInfo = undefined;
    } else if (authorization.startsWith("Token ")||authorization.startsWith("Bearer ")) {
      const token = authorization.slice(6).trim();
      userInfo = await usersCollection.findOne({tokens: [token]});
    }

    if (!userInfo) return res.status(401).json({error: "invalid authentication"});
    req.userInfo = userInfo;
    req.session.userID = userInfo.userID;
    return req.session.save(next);
  }

  if (typeof req.session.userID === "string" && !req.userInfo) req.userInfo = await usersCollection.findOne({userID: req.session.userID});
  return next();
}