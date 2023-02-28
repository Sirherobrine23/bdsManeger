import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingMessage } from "node:http";
import mongodb from "mongodb";

export type authSchema = ({
  type: "token",
  authToken: string,
}|{
  type: "user",
});

async function authCollection(): Promise<mongodb.Collection<authSchema>> {
  if (global["authCollection"]) return global["authCollection"];
  const connection = new mongodb.MongoClient(process.env.MONGOAUTH, {
    serverApi: mongodb.ServerApiVersion.v1
  });
  await new Promise((done, reject) => connection.once("error", reject).once("connectionReady", done));
  return global["authCollection"] = connection.db(process.env.NODE_ENV).collection<authSchema>("auth");
}

async function authHandler(req: NextApiRequest|IncomingMessage, res?: NextApiResponse): Promise<boolean> {
  const { authorization = "" } = req.headers;
  if (typeof authorization === "string" && !!authorization) {
    const coll = await authCollection();
    if (authorization.startsWith("token")) {
      const token = authorization.slice(5).trim();
      const exists = await coll.findOne({type: "token", authToken: token});
      if (!exists) return true;
      return false;
    } else if (authorization.startsWith("basic")) {
      const { email = "", password = "", token = "" } = JSON.parse(Buffer.from(authorization.slice(5).trim(), "base64").toString("utf8"));
      console.log({
        email,
        password,
        token
      });
      return false;
    }
  }
  return true;
}

export default Object.assign(authHandler, {
  async setHeader(req: NextApiRequest|IncomingMessage, res: null|NextApiResponse, email: string, password?: string) {
    res.setHeader("WWW-Authenticate", )
  }
});