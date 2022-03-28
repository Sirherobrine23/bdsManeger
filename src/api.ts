import express from "express";
import cors from "cors";
import * as ServerManeger from "./server";
import { isDate } from "util/types";
const app = express();
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use((req, res, next) => {
  res.json = (body) => {
    res.set("Content-Type", "application/json");
    res.send(JSON.stringify(body, (key, value) => {
      if (typeof value === "bigint") value = value.toString();
      else if (isDate(value)) value = value.toString();
      return value;
    }, 2));
    return res;
  }
  return next();
});

export function listen(port: number|string) {app.listen(port, () => console.log("API Listening on port %s", port));}

// Get Sessions
app.all("/", ({res}) => res.json((() => {
  const sessions = ServerManeger.getSessions();
  const data = {};
  Object.keys(sessions).map(key => data[key] = {
    players: sessions[key].getPlayer(),
    ports: sessions[key].ports()
  });
  return data;
})()));

// Session info
app.get("/:SessionID", (req, res) => {
  const SessionID: string = req.params.SessionID;
  const Sessions = ServerManeger.getSessions();
  if (!Sessions[SessionID]) return res.status(404).send({message: "Session not found"});
  const filter = Object.keys(Sessions[SessionID]).filter(a => !(a === "addonManeger" || a ==="commands"));
  const data = {};
  filter.forEach(key => data[key] = Sessions[SessionID][key]);
  return res.json(data);
});

// Get Players
app.get("/:SessionID/player", (req, res) => {
  const SessionID: string = req.params.SessionID;
  const Sessions = ServerManeger.getSessions();
  if (!Sessions[SessionID]) return res.status(404).send({message: "Session not found"});
  return res.json(Sessions[SessionID].getPlayer());
});

// Get Player Info
app.get("/:SessionID/player/:Player", (req, res) => {
  const { SessionID, Player } = req.params;
  const Sessions = ServerManeger.getSessions();
  if (!Sessions[SessionID]) return res.status(404).send({message: "Session not found"});
  return res.json(Sessions[SessionID].getPlayer()[Player]);
});

// Player Action
app.post("/:SessionID/player/:Player/:Action", (req, res) => {
  const { SessionID, Player, Action } = req.params;
  const Sessions = ServerManeger.getSessions();
  if (!Sessions[SessionID]) return res.status(404).send({message: "Session not found"});
  const player = Sessions[SessionID].getPlayer()[Player];
  if (!player) return res.status(404).send({message: "Player not found"});
  if (Action !== "connect") return res.status(400).send({message: "Player no connected to server"});
  if (Action.toLowerCase() === "tp") {
    const { x, y, z } = req.body;
    if (!x || !y || !z) return res.status(400).send({message: "Missing x, y or z"});
    Sessions[SessionID].commands.tpPlayer(Player, parseInt(x), parseInt(y), parseInt(z));
    return res.status(200).send({message: "Player teleported"});
  }
  return res.status(400).send({message: "Action not found"});
});