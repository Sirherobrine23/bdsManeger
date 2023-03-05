#!/usr/bin/env node
import expressLayer from "express/lib/router/layer.js";
import express from "express";
import bdsCore, { serverManeger, serverRun } from "@the-bds-maneger/core";

const sessions: {[id: string]: serverRun} = {};
process.on("exit", () => Object.keys(sessions).forEach(k => sessions[k].stopServer()));

expressLayer.prototype.handle_request = async function handle_request_promised(...args) {var fn = this.handle; if (fn.length > 3) return args.at(-1)(); await Promise.resolve().then(() => fn.call(this, ...args)).catch(args.at(-1));}
const app = express();
app.use(express.json(), express.urlencoded({extended: true}), (req, res, next) => {
  req.res.json = res.json = function(body: any) {return Object.assign(res, Promise.resolve(body).then(d => res.send(JSON.stringify(d, null, 2))).catch(next));}
  next();
});

// Get current server running
app.get("/v1", ({res}) => res.json(Object.keys(sessions).reduce((acc, key) => {
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
}, {}))).post("/v1", async (req, res) => {
  const { platform = "bedrock", version = "latest", altServer = "", serverID = "" } = req.body;
  if (platform === "bedrock") return res.json(bdsCore.Bedrock.installServer({
    newID: !serverID,
    ID: serverID,
    version,
    altServer,
    allowBeta: req.query.beta === "true"
  })); else if (platform === "java") return res.json(bdsCore.Java.installServer({
    newID: !serverID,
    ID: serverID,
    version,
    altServer,
  }));
  return res.status(400).json({error: "Check platform"});
});

app.get("/v1/id", async ({res}) => res.json(await serverManeger.listIDs()));
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