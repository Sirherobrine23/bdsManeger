import cookie, { Store } from "express-session";
import { database } from "./db.js";
import { config } from "./config.js";

declare module "express-session" {
  interface SessionData {
    userID: string;
  }
}

export type cookieSave = {
  sid: string;
  session: cookie.SessionData;
};

export const cookieCollection = database.collection<cookieSave>("authCookie");
class bdsSession extends Store {
  nMap = new Map<string, cookie.SessionData>();
  destroy(sid: string, callback?: (err?: any) => void): void {
    if (this.nMap.has(sid)) this.nMap.delete(sid);
    cookieCollection.deleteOne({ sid }).then(() => callback(), err => callback(err));
  }

  get(sid: string, callback: (err?: any, session?: cookie.SessionData) => void) {
    if (this.nMap.has(sid)) return callback(null, this.nMap.get(sid));
    (async () => {
      try {
        const inDb = await cookieCollection.findOne({ sid });
        if (inDb) return callback(null, inDb.session);
        return callback();
      } catch (err) {
        return callback(err);
      }
    })();
  }

  load(sid: string, callback: (err?: any, session?: cookie.SessionData) => any): void {
    if (this.nMap.has(sid)) return callback(null, this.nMap.get(sid));
    (async () => {
      try {
        const inDb = await cookieCollection.findOne({ sid });
        if (inDb) return callback(null, inDb.session);
        return callback();
      } catch (err) {
        return callback(err);
      }
    })();
  }

  set(sid: string, session: cookie.SessionData, callback?: (err?: any) => void) {
    (async () => {
      try {
        if (this.nMap.has(sid)) return callback();
        this.nMap.set(sid, session);
        const existsInDb = await cookieCollection.findOne({ sid });
        if (existsInDb) await cookieCollection.deleteOne({ sid });
        await cookieCollection.insertOne({
          sid,
          session: typeof session["toJSON"] === "function" ? session["toJSON"]() : session,
        });
        this.nMap.delete(sid);
        return callback();
      } catch (err) {
        callback(err);
      }
    })();
  }

  all(callback: (err: any, obj?: cookie.SessionData[] | { [sid: string]: cookie.SessionData; }) => void) {
    (async () => {
      try {
        const sessions = await cookieCollection.find().toArray();
        callback(null, sessions.reduce<Parameters<typeof callback>[1]>((acc, data) => {
          acc[data.sid] = data.session;
          return acc;
        }, {}));
      } catch (err) {
        callback(err);
      }
    })();
  }

  clear(callback?: (err?: any) => void) {
    cookieCollection.deleteMany({}).then(() => callback(), err => callback(err));
  }
}

export default cookie({
  name: "bdsLogin",
  secret: config.cookieSecret,
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 * 30,
    httpOnly: false,
    secure: "auto"
  },
  store: new bdsSession(),
});