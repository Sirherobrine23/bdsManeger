// Node Internal modules
const fs = require("fs");

// Bds Manager Core modules
const BdsCore = require("../../../../index");
const BdsChecks = require("../../../UsersAndtokenChecks");
const BdsSettings = require("../../../../lib/BdsSettings");

// Express
const express = require("express");
const app = express.Router();

// Find Player
const GetPlayerJson = (Platform = BdsCore.getBdsConfig().server.platform) => ([...{...JSON.parse(fs.readFileSync(BdsCore.BdsSettigs.GetPaths("player"), "utf8"))}[Platform]]);

// Routes
app.get("/", (req, res) => {
    const { Platform = BdsSettings.GetPlatform(), Player = null, Action = null } = req.query;
    let PlayerList = GetPlayerJson(Platform);
    if (Player) PlayerList = PlayerList.filter(PLS => PLS.Player === Player);
    if (Action) PlayerList = PlayerList.filter(PLS => PLS.Action === Action);
    
    if (Player || Action) {
        if (PlayerList.length > 0) res.json(PlayerList);
        else res.status(404).json({
            Error: "Player not found",
            querys: req.query
        });
        return;
    }
    res.json(PlayerList);
    return;
});

// Players Actions in Backside Manager
// kick player
app.get("/kick", (req, res) => {
    const { Token = null, Player = "Sirherobrine", Text = "You have been removed from the Server" } = req.query;
    if (!Token) return res.status(400).json({ error: "Token is required" });
    if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

    // Kick player
    const RunnerServer = require("../../../BdsManegerServer").BdsRun;
    try {
        RunnerServer.kick(Player, Text);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({
            error: "Server nots Run",
            text: `${error}`
        });
    }
});

// Ban player
app.get("/ban", (req, res) => {
    const { Token = null, Player = "Sirherobrine" } = req.query;
    if (!Token) return res.status(400).json({ error: "Token is required" });
    if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

    // Ban player
    const RunnerServer = require("../../../BdsManegerServer").BdsRun;
    try {
        RunnerServer.ban(Player);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({
            error: "Server nots Run",
            text: `${error}`
        });
    }
});

// Op player
app.get("/op", (req, res) => {
    const { Token = null, Player = "Sirherobrine" } = req.query;
    if (!Token) return res.status(400).json({ error: "Token is required" });
    if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

    // Op player
    const RunnerServer = require("../../../BdsManegerServer").BdsRun;
    try {
        RunnerServer.op(Player);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({
            error: "Server nots Run",
            text: `${error}`
        });
    }
});

// Deop player
app.get("/deop", (req, res) => {
    const { Token = null, Player = "Sirherobrine" } = req.query;
    if (!Token) return res.status(400).json({ error: "Token is required" });
    if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

    // Deop player
    const RunnerServer = require("../../../BdsManegerServer").BdsRun;
    try {
        RunnerServer.deop(Player);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({
            error: "Server nots Run",
            text: `${error}`
        });
    }
});

// Say to Server
app.get("/say", (req, res) => {
    const { Token = null, Text = "Hello Server" } = req.query;
    if (!Token) return res.status(400).json({ error: "Token is required" });
    if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

    // Say to Server
    const RunnerServer = require("../../../BdsManegerServer").BdsRun;
    try {
        RunnerServer.say(Text);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({
            error: "Server nots Run",
            text: `${error}`
        });
    }
});

// Tp player
app.get("/tp", (req, res) => {
    const { Token = null, Player = "Sirherobrine", X = 0, Y = 0, Z = 0 } = req.query;
    if (!Token) return res.status(400).json({ error: "Token is required" });
    if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

    // Tp player
    const RunnerServer = require("../../../BdsManegerServer").BdsRun;
    try {
        RunnerServer.tp(Player, {
            x: X,
            y: Y,
            z: Z
        });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({
            error: "Server nots Run",
            text: `${error}`
        });
    }
});

// Export Routes
module.exports = app;
module.exports.APIPaths = [...app.stack.map(d => {
    if (d.route) {
        if (d.route.path) return d.route.path;
        else return d.route.regexp.source;
    }
    return null;
}).filter(d => d)];