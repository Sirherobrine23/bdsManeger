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
}, express.json(), express.urlencoded({extended: true}), express.text());

// Get current server running
app.route("/v1").get(({res}) => res.json(Object.keys(sessions).reduce((acc, key) => {
  acc[key] = {
    ports: sessions[key].portListening,
    player: sessions[key].playerActions.reverse().reduce((acc, player) => {
      if (!acc[player.playerName]) acc[player.playerName] = player;
      else acc[player.playerName] = {
        ...player,
        previous: acc[player.playerName]
      };
      return acc;
    }, {})
  };
  return acc;
}, {}))).post(async (req, res) => {
  const { platform = "bedrock", version = "latest", altServer = "", serverID = "" } = req.body || {};
  if (platform === "bedrock") return res.json(bdsCore.Bedrock.installServer({
    newID: !serverID,
    ID: serverID,
    version,
    altServer,
    allowBeta: String(req.body.beta ?? req.query.beta) === "true"
  })); else if (platform === "java") return res.json(bdsCore.Java.installServer({
    newID: !serverID,
    ID: serverID,
    version,
    altServer,
  }));
  return res.status(400).json({error: "Check platform"});
});

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

app.get("/v1/platform/:platform?", async (req, res) => {
  const { platform = "bedrock" } = req.params;
  if (!(platform === "bedrock"||platform === "java")) return res.status(400).json({error: "Invalid platform"});
  if (platform === "bedrock") {
    return res.json(await bdsCore.Bedrock.listVersions(req.query.alt as any));
  }
  return res.json(await bdsCore.Java.listVersions(req.query.alt as any));
});

app.post("/v1/:id", async (req, res) => {
  const { id } = req.params;
  const idInfo = (await serverManeger.listIDs()).find(f => f.id === id);
  if (!idInfo) return res.status(400).json({error: "ID not exsists"});
  const { action = "start" } = req.body;
  if (!(["start", "stop"]).includes(action)) return res.status(400).json({error: "Invalid action"});
  if (action === "start") {
    if (sessions[id]) return res.status(400).json({error: "Server are running"});
    sessions[id] = await (idInfo.platform === "java" ? bdsCore.Java.startServer : bdsCore.Bedrock.startServer)({
      newID: false,
      ID: id
    });
    sessions[id].once("close", () => delete sessions[id]).on("line", (line, from) => console.log("[%s from %s]: %s", id, from, line));
    return res.json(sessions[id]);
  }
  if (!sessions[id]) return res.status(400).json({error: "Server not running"});
  return res.json(await sessions[id].stopServer());
});

// Listen
app.listen(process.env.PORT ?? 3000, function() {const a = this.address(); console.log("Bds API Listen on %O", a?.["port"] ?? a)});