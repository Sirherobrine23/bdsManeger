const express = require("express");
const app = express.Router();
const ServerManeger = require("../ServerManeger");
module.exports = app;
app.get("/players", (req, res) => {
  const ServerSessions = ServerManeger.GetSessions().map(session => ({
    uuid: session.uuid,
    Players: session.Players_in_Session()
  }));
  return res.json(ServerSessions);
});

// Players Actions in Backside Manager
// kick player
app.get("/players/kick", (req, res) => {
  const { Player = "Sirherobrine", Text = "You have been removed from the Server" } = req.query;

  // Kick player
  const Sessions = ServerManeger.GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.kick(Player, Text));
    return res.json({ success: true });
  } else {
    res.status(400).json({
      error: "Server nots Run"
    });
  }
});

// Ban player
app.get("/players/ban", (req, res) => {
  const { Player = "Sirherobrine" } = req.query;

  // Ban player
  const Sessions = ServerManeger.GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.ban(Player));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Op player
app.get("/players/op", (req, res) => {
  const { Player = "Sirherobrine" } = req.query;

  // Op player
  const Sessions = ServerManeger.GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.op(Player));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Deop player
app.get("/players/deop", (req, res) => {
  const { Player = "Sirherobrine" } = req.query;

  // Deop player
  const Sessions = ServerManeger.GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.deop(Player));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Say to Server
app.get("/players/say", (req, res) => {
  const { Text = "Hello Server" } = req.query;

  // Say to Server
  const Sessions = ServerManeger.GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.say(Text));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Tp player
app.get("/players/tp", (req, res) => {
  const { Player = "Sirherobrine", X = 0, Y = 0, Z = 0 } = req.query;

  // Tp player
  const Sessions = ServerManeger.GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.tp(Player, X, Y, Z));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});