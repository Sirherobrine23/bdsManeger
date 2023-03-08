#!/usr/bin/env node
import expressLayer from "express/lib/router/layer.js";
import express from "express";
import yaml from "yaml";
import bdsCore, { serverManeger, serverRun } from "@the-bds-maneger/core";

const sessions: {[id: string]: serverRun} = {};
process.on("exit", () => Object.keys(sessions).forEach(k => sessions[k].stopServer()));

// Catch error
for (const k of ["uncaughtException", "unhandledRejection"]) process.on(k, err => console.log(err));

expressLayer.prototype.handle_request = async function handle_request_promised(...args) {var fn = this.handle; if (fn.length > 3) return args.at(-1)(); await Promise.resolve().then(() => fn.call(this, ...args)).catch(args.at(-1));}
const app = express();
app.disable("etag").disable("x-powered-by").use(async (req, res, next) => {
  req.res.json = res.json = function(body: any) {return Object.assign(res, Promise.resolve(body).then(d => res.send(JSON.stringify(d, null, 2))).catch(next));}
  if (typeof req.headers["content-type"] === "string" && (["application/x-yaml", "text/yaml", "text/x-yaml"]).find(k => req.headers["content-type"].includes(k))) {
    const data: Buffer[] = [];
    req.on("data", d => data.push(d));
    await new Promise((done, reject) => req.on("error", reject).once("close", () => {
      try {
        req.body = yaml.parse(Buffer.concat(data).toString("utf8"));
        done(null);
      } catch (err) {
        reject(err);
      }
    }));
  }
  next();
}, express.json(), express.urlencoded({extended: true}));

// Get current server running
app.route("/v1").get(({res}) => res.json(Object.keys(sessions).reduce((acc, key) => {
  acc[key] = {
    ports: sessions[key].portListening,
    player: sessions[key].playerActions.reduce((acc, player) => {
      if (!acc[player.playerName]) acc[player.playerName] = player;
      else acc[player.playerName] = {
        ...player,
        previous: acc[player.playerName]
      };
      return acc;
    }, {})
  };
  return acc;
}, {})));

app.route("/v1/id").get(async ({res}) => res.json(await serverManeger.listIDs())).delete(async (req, res) => {
  const IDs: string[] = [];
  if (typeof req.body === "string") IDs.push(...(String(req.body).split(/[;,]/).map(s => s.trim())))
  else if (Array.isArray(req.body)) IDs.push(...(req.body.map(k => typeof k === "string" ? k : k?.id).filter(s => !!s)))

  if (IDs.find(k => k === "*")) return Promise.all((await bdsCore.listIDs()).map(async (idManeger) => idManeger.delete().then(() => ({id: idManeger.id})).catch(err => ({err: String(err?.message || err)})))).then(res.json);
  else if (IDs.length > 0) {
    const folder = (await bdsCore.listIDs()).filter(k => IDs.includes(k.id));
    if (folder.length === 0) return res.status(400).json({error: "all id is invalid"});
    return Promise.all(folder.map(async (idManeger) => idManeger.delete().then(() => ({id: idManeger.id})).catch(err => ({err: String(err?.message || err)})))).then(res.json);
  }

  return res.status(400).json({
    error: "Body is String or Array"
  });
});

app.get("/v1/platform(s)?/:platform?", async (req, res) => {
  const { platform = "bedrock" } = req.params;
  if (!(platform === "bedrock"||platform === "java")) return res.status(400).json({error: "Invalid platform"});
  if (platform === "bedrock") {
    return res.json(await bdsCore.Bedrock.listVersions(req.query.alt as any));
  }
  return res.json(await bdsCore.Java.listVersions(req.query.alt as any));
});

app.route("/v1/server").put(async (req, res) => {
  const { platform } = req.body as { platform: "bedrock"|"java" };
  if (!(platform === "bedrock" || platform === "java")) return res.status(400).json({error: "Platform is invalid"});
  const platformInstall = await (platform === "java" ? bdsCore.Java.installServer : bdsCore.Bedrock.installServer)({
    newID: true,
    version: req.body?.version ?? "latest",
    altServer: req.body?.altServer as never,
    allowBeta: req.body?.allowBeta ?? req.query.allowBeta === "true"
  });
  delete platformInstall["downloads"]?.server?.urls;
  return res.json(platformInstall);
}).patch(async (req, res) => {
  const { id } = req.body;
  const localID = (await bdsCore.listIDs()).find(ind => ind.id === id);
  if (!localID) return res.status(400).json({error: "server not installed to update"});
  if (sessions[id]) await sessions[id].stopServer();
  const platformInstall = await (localID.platform === "java" ? bdsCore.Java.installServer : bdsCore.Bedrock.installServer)({
    newID: true,
    version: req.body?.version ?? "latest",
    altServer: req.body?.altServer as never,
    allowBeta: req.body?.allowBeta ?? req.query.allowBeta === "true"
  });
  delete platformInstall["downloads"]?.server?.urls;
  return res.json(platformInstall);
}).post(async (req, res) => {
  const { id } = req.body;
  const idInfo = (await serverManeger.listIDs()).find(f => f.id === id);
  if (!idInfo) return res.status(400).json({error: "ID not exsists"});
  if (sessions[id]) return res.status(400).json({error: "Server are running"});
  sessions[id] = await (idInfo.platform === "java" ? bdsCore.Java.startServer : bdsCore.Bedrock.startServer)({
    newID: false,
    ID: id
  });
  sessions[id].once("close", () => delete sessions[id]).on("line", (line, from) => console.log("[%s from %s]: %s", id, from, line));
  return res.json({
    spawnargs: sessions[id].spawnargs,
    pid: sessions[id].pid,
  });
});

app.route("/v1/server/:id").get((req, res) => {
  if (!sessions[req.params.id]) return res.status(400).json({error: "Session not running"});
  return res.json({
    bedrockConnect: sessions[req.params.id].runOptions.paths.platform === "java" ? null : `minecraft:?addExternalServer=${sessions[req.params.id].runOptions.paths.id}|${req.hostname}:${sessions[req.params.id].portListening.at(0).port}`,
    ports: sessions[req.params.id].portListening,
    player: sessions[req.params.id].playerActions.reduce((acc, player) => {
      if (!acc[player.playerName]) acc[player.playerName] = player;
      else acc[player.playerName] = {
        ...player,
        previous: acc[player.playerName]
      };
      return acc;
    }, {})
  });
}).post(async (req, res) => {
  if (!sessions[req.params.id]) return res.status(400).json({error: "Session not running"});
  if (Array.isArray(req.body)) sessions[req.params.id].sendCommand(...req.body);
  else sessions[req.params.id].sendCommand(req);
  return res.sendStatus(200);
}).delete((req, res) => {
  if (!sessions[req.params.id]) return res.status(400).json({error: "Session not running"});
  return sessions[req.params.id].stopServer().then(res.json).catch(err => res.status(400).json({err: String(err?.message || err)}));
});

// Listen
app.listen(process.env.PORT ?? 3000, function() {const a = this.address(); console.log("Bds API Listen on %O", a?.["port"] ?? a)});