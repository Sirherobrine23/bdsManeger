import ssh2 from "ssh2";
import { config } from "./config.js";
import { userCollection, serveCollection } from "./db.js";
import { sessionMAP } from "./mcserver.js";

export const server = new ssh2.Server({
  hostKeys: config.sshServer.hostKeys,
  banner: config.sshServer.banner,
});

server.on("error", err => console.error(err));
server.on("connection", client => {
  let username: string;
  client.on("error", err => console.error(err));
  client.on("authentication", async ctx => {
    username = ctx.username;
    const serverInfo = await serveCollection.findOne({ID: username});
    if (!serverInfo) return ctx.reject();
    if (ctx.method === "hostbased" || ctx.method === "keyboard-interactive") return ctx.reject(["password", "publickey"]);
    else if (ctx.method === "none") return ctx.reject(["password", "publickey"]);
    else if (ctx.method === "publickey") {
      const { key } = ctx;
      const Users = await userCollection.find({ID: serverInfo.users}).toArray();
      const userInfo = Users.find(user => user.sshKeys.find(userKey => {
        const ps = ssh2.utils.parseKey(userKey.private);
        if (ps instanceof Error) return false;
        return Buffer.compare(ps.getPublicSSH(), key.data) === 0;
      }));
      if (!userInfo) return ctx.reject();
    } else if (ctx.method === "password") {
      const userInfo = await userCollection.findOne({$or: [serverInfo.users.map(ID => ({ID}))], tokens: [ctx.password]});
      if (!userInfo) return ctx.reject();
    }
    return ctx.accept();
  });
  client.on("ready", () => {
    client.on("session", (accept, reject) => {
      if (!(sessionMAP.has(username))) return reject();
      const serverSession = sessionMAP.get(username);
      const session = accept();
      serverSession.stdout.pipe(session.stdout, {end: false});
      serverSession.stderr.pipe(session.stderr, {end: false});
      serverSession.stdin.pipe(session.stdin, {end: false});
      session.once("close", () => {
        serverSession.stdout.unpipe(session.stdout);
        serverSession.stderr.unpipe(session.stderr);
        session.stdin.unpipe(serverSession.stdin);
      });
    });
  });
});