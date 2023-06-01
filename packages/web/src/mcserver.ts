import { Bedrock, Java, serverRun } from "@the-bds-maneger/core";
import express from "express";
import fs from "node:fs/promises";
import { createServerID, getServerPaths, passwordCheck, serversIDs, userCollection } from "./db.js";

const app = express.Router();
export default app;

declare global {
  namespace Express {
    export interface Request {
      userInfo?: userCollection;
    }
  }
}

// Check token
app.use(async (req, res, next) => {
  if (typeof req.headers.authorization === "string") {
    const { authorization } = req.headers;
    if (authorization.startsWith("Basic ")) {
      const authDecrypt = Buffer.from(authorization.slice(5).trim(), "base64").toString("utf8");
      const username = authDecrypt.slice(0, authDecrypt.indexOf(":"));
      const password = authDecrypt.slice(authDecrypt.indexOf(":") + 1);
      if (!(username && password)) return res.status(401).json({ error: "Basic auth require username and password!" });
      const userInfo = await userCollection.findOne({ $or: [{ username }, { email: username }] });
      if (!userInfo) return res.status(401).json({ error: "User not exists" });
      else if (!(await passwordCheck(userInfo, password))) return res.status(401).json({ error: "Invalid password" });
      req.session.userID = userInfo.ID;
    } else if (authorization.startsWith("Token ") || authorization.startsWith("token ")) {
      const token = authorization.slice(5).trim();
      const userInfo = await userCollection.findOne({ tokens: [token] });
      if (!userInfo) return res.status(401).json({ error: "Token not exists" });
      req.session.userID = userInfo.ID;
    } else return res.status(401).json({ error: "Invalid authorization schema" });
    await new Promise<void>((done, reject) => req.session.save(err => err ? reject(err) : done()));
  }

  if (typeof req.session.userID !== "string") return res.status(401).json({ error: "Not authenticated" });
  const userInfo = req.userInfo = await userCollection.findOne({ ID: req.session.userID });
  if (!userInfo) {
    await new Promise<void>((done, reject) => req.session.destroy(err => err ? reject(err) : done()));
    return res.status(401).json({ error: "User not exists" });
  } else if (userInfo.permissions.includes("confirm")) return res.status(401).json({ error: "Unauthorized, ask the Site administrator for confirmation!" });

  return next();
});

export const sessionMAP = new Map<string, serverRun>();

// List auth user server allow access
app.get("/", async (req, res) => {
  const servers = await serversIDs.find({ users: [req.session.userID] }).toArray();
  return res.json(servers.map(info => ({
    ID: info.ID,
    platform: info.platform,
    name: info.name,
    running: sessionMAP.has(info.ID),
  })));
});

// Create new Server
app.post("/", async (req, res) => {
  if (!(req.userInfo.permissions.includes("admin"))) return res.status(401).json({ error: "You no have access to create server" });
  else if (typeof req.body !== "object") return res.status(400).json({ error: "Require body to setup server" });
  const { platform } = req.body;
  if (!(platform === "bedrock" || platform === "java")) return res.status(400).json({ error: "Invalid platform", body: req.body });
  const v1 = await createServerID(platform, [req.session.userID]);
  if (platform === "bedrock") {
    await Bedrock.installServer(v1, { version: req.body.version, altServer: req.body.altServer, allowBeta: !!req.body.allowBeta });
  } else {
    await Java.installServer(v1, { version: req.body.version, altServer: req.body.altServer, allowBeta: !!req.body.allowBeta });
  }

  return res.status(201).json({
    ID: v1.id
  });
});

app.delete("/", async (req, res) => {
  if (!(req.userInfo.permissions.includes("admin"))) return res.status(401).json({ error: "You no have access to create server" });
  else if (typeof req.body !== "object") return res.status(400).json({ error: "Require body to setup server" });
  const serverInfo = await serversIDs.findOne({ ID: String(req.body.id) });
  if (!(serverInfo)) return res.status(404).json({ error: "Server not exists" });
  if (sessionMAP.has(serverInfo.ID)) await sessionMAP.get(serverInfo.ID).stopServer();
  const v1 = await getServerPaths(serverInfo.ID);
  await fs.rm(v1.rootPath, { recursive: true, force: true });
  return res.json((await serversIDs.findOneAndDelete({ ID: serverInfo.ID })).value);
});

app.get("/server/:ID", async (req, res) => {
  const serverInfo = await serversIDs.findOne({ ID: req.params.ID });
  if (!(serverInfo)) return res.status(404).json({ error: "Server not exists" });
  else if (!(serverInfo.users.includes(req.session.userID))) return res.status(404).json({ error: "You do not have permission for this server" });
  const Running = sessionMAP.get(serverInfo.ID);
  return res.json({
    running: !!Running,
    ports: Running?.portListening,
    players: Running?.playerActions,
  });
});

app.get("/server/:ID/hotbackup", async (req, res) => {
  const serverInfo = await serversIDs.findOne({ ID: req.params.ID });
  if (!(serverInfo)) return res.status(404).json({ error: "Server not exists" });
  else if (!(serverInfo.users.includes(req.session.userID))) return res.status(404).json({ error: "You do not have permission for this server" });
  else if (!(sessionMAP.has(req.params.ID))) return res.status(400).json({ error: "Server not running" });
  const run = sessionMAP.get(serverInfo.ID);
  const data = await run.hotBackup();
  if (!data) return res.status(503).json({ error: "Server not support hot backup" });
  return data.pipe(res.writeHead(200, {}));
});

app.post("/server/:ID", async (req, res) => {
  const serverInfo = await serversIDs.findOne({ ID: req.params.ID });
  if (!(serverInfo)) return res.status(404).json({ error: "Server not exists" });
  else if (!(serverInfo.users.includes(req.session.userID))) return res.status(404).json({ error: "You do not have permission for this server" });
  else if (sessionMAP.has(serverInfo.ID)) return res.status(400).json({ error: "the server is already running" });
  const v1 = await getServerPaths(serverInfo.ID);
  const server = await (serverInfo.platform === "bedrock" ? Bedrock.startServer : Java.startServer)(v1, {});
  sessionMAP.set(v1.id, server);
  server.once("exit", () => sessionMAP.delete(v1.id));
  return res.status(201).json({ ID: v1.id, pid: server.pid });
});

app.delete("/server/:ID", async (req, res) => {
  const serverInfo = await serversIDs.findOne({ ID: req.params.ID });
  if (!(serverInfo)) return res.status(404).json({ error: "Server not exists" });
  else if (!(serverInfo.users.includes(req.session.userID))) return res.status(404).json({ error: "You do not have permission for this server" });
  else if (!(sessionMAP.has(req.params.ID))) return res.status(400).json({ error: "Server not running" });
  return res.json(await sessionMAP.get(req.params.ID).stopServer());
});