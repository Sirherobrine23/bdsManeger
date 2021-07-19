const express = require("express");
const app = express.Router();
const { GetPlatform } = require("../../../lib/BdsSettings")
const bds = require("../../../index");
const { token_verify, CheckPlayer } = require("../../Scripts/check");
const { readFileSync } = require("fs");
const docs = require("../../../BdsManegerInfo.json").docs;

// Players info and maneger
app.get("/", (req, res) => {
    var { player, status, platform} = req.query;
    const players_json = JSON.parse(readFileSync(bds.players_files, "utf8"))[(platform || GetPlatform())];
    var response = {};
    
    if (player) {
        if (players_json[player]) response = players_json[player];
        else response = {
            date: null,
            connected: null,
            xboxID: null,
            update: [{date: null, connected: null}]
        }
        return res.json(response);
    } else if (status) {
        status = (() => {if (status === "online" || status === "true") return true; else return false})()
        for (let index of Object.getOwnPropertyNames(players_json)) if (players_json[index].connected === status) response[index] = players_json[index]
        return res.json(response);
    }
    response = players_json
    return res.json(response);
});

app.get("/actions/:TYPE/:TOKEN/:PLAYER*", (req, res) => {
    const { TYPE, TOKEN, PLAYER } = req.params;
    const { text } = req.query;
    // Pre Check
    if (!(token_verify(TOKEN) || CheckPlayer(PLAYER))) return res.status(401).send("Check your parameters");

    // Post Check
    if (TYPE === "ban") res.json({ok: bds.command(`ban ${PLAYER}`)});
    else if (TYPE === "kick") res.json({ok: bds.command(`kick ${PLAYER} ${text}`)});
    else if (TYPE === "op") res.json({ok: bds.command(`op ${PLAYER}`)});
    else if (TYPE === "deop") res.json({ok: bds.command(`deop ${PLAYER}`)});
    else res.sendStatus(422)
});

// Actions Redirect
app.all("/actions/*", ({ res }) => res.send(`${docs.url}/${docs.rest_api}#players-actions`))
app.all("/*", ({ res }) => res.send(`${docs.url}/${docs.rest_api}#players-actions`))

module.exports = app;