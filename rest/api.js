const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");
const express = require("express");
const bds = require("../index");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { GetKernel } = require("../lib/BdsSystemInfo");
const commandExist = require("../lib/commandExist");
const { GetPlatform, GetServerVersion, GetPaths, UpdatePlatform, bds_dir } = require("../lib/BdsSettings")
const admzip = require("adm-zip");
const pretty = require("express-prettify");
const latest_log = resolve(GetPaths("log"), "latest.log")
const docs = require("../extra.json").docs;
const { CheckPlayer, token_verify } = require("../scripts/check");

function api(port_api = 1932){
    const app = express();
    // Enable if you"re behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // see https://expressjs.com/en/guide/behind-proxies.html
    // app.set("trust proxy", 1);

    app.use(cors());
    app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(rateLimit({windowMs: 15 * 60 * 1000, /* 15 minutes */ max: 100 /* limit each IP to 100 requests per windowMs*/ }));
    app.use(pretty({always: true, spaces: 2}));
    app.use(fileUpload({limits: { fileSize: 512 * 1024 }}));
    app.use(require("request-ip").mw());

    // Main
    app.get("/", (req, res) => {
        return res.send(`<html>
            <body>
                <h1>Hello From Bds Maneger Core</h1>
                <a>If this page has loaded it means that the API is working as planned, More information access the API documentation at: <a href="${docs.url}/${docs.main}">Bds Maneger Core</a>. </a>
                <p><span>Bds Maneger core Version: ${bds.package_json.version}</span></p>
                <p><h3>GET</h3></p>
                <p><a href="./info">Basic Info server and System</a></p>
                <p><a href="./players">Players who logged on to the server</a></p>
                <p><h3>POST</h3></p>
                <p><a href="./service">basic Services: Stop, start and restart</a></p>
            </body>
            <p>by <a href="https://github.com/Sirherobrine23">Sirherobrine23</a></p>
        </html>`);
    });

    app.post("/bds_command", (req, res) => {
        const body = req.body;
        var comand = body.command
        const status = {
            code: 401,
            status: false
        }
        if (token_verify(body.token)) {
            bds.command(comand)
            status.code = 201
            status.status = true
        }
        res.status(status.code).send(status)
    });

    // Players info and maneger
    app.get("/players", (req, res) => {
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

    app.get("/players/actions/:TYPE/:TOKEN/:PLAYER*", (req, res) => {
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
    app.all("/players/actions/*", ({ res }) => res.redirect(`${docs.url}/${docs.rest_api}#players-actions`))
    app.all("/players/actions", ({ res }) => res.redirect(`${docs.url}/${docs.rest_api}#players-actions`))
    
    // Backup
    app.get("/backup", (req, res) => {
        const { token } = req.query;
        // Check Token
        if (!(token_verify(token))) return res.status(401).send("Check your token");

        // Return File
        const backup = bds.backup()
        return res.sendFile(backup.file_path)
    });

    // Server Sevices
    app.all("/service", ({res}) => res.redirect(`${docs.url}/${docs.rest_api}#disable-basic-services`));

    // bds maneger
    app.post("/bds/download", (req, res) => {
        const { token, version, platform } = req.body
        if (!(token_verify(token))) return res.status(401).send("Check your token");

        // Server Download
        if (platform) UpdatePlatform(platform);
        try {
            bds.download(version, true, function(){
                return res.json({
                    version: version,
                    platform: GetPlatform()
                })
            })
        } catch (error) {
            res.status(501).send(error)
        }
    });

    app.post("/bds/upload", (req, res) => {
        const { token } = req.headers;
        if (!(token_verify(token))) return res.status(401).send("Check your token");
        if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send("No files were uploaded.");

        // Extract
        for (let index of Object.getOwnPropertyNames(req.files)){
            const fileWorld = req.files[index];
            const unzip = new admzip(Buffer.from(fileWorld.data));
            unzip.extractAllTo(bds_dir)
        }
        return res.send("Ok")
    });

    // System and Server info
    app.get("/info", ({ res }) => res.redirect("bds/info"))
    app.get("/bds/info", ({ res }) => {
        const config = bds.get_config();
        var info = {
            server: {
                platform: GetPlatform(),
                world_name: config.world,
                running: bds.detect(),
                port: config.portv4,
                port6: config.portv6,
                max_players: config.players,
                whitelist: config.whitelist,
            },
            sys: {
                arch: bds.arch,
                system: process.platform,
                Kernel: GetKernel(),
                IS_CLI: JSON.parse(process.env.IS_BDS_CLI || false),
                IS_DOCKER: JSON.parse(process.env.BDS_DOCKER_IMAGE || false),
                IS_NPX: (process.env.npm_lifecycle_event === "npx"),
                QEMU_STATIC: commandExist("qemu-x86_64-static")
            },
            bds_maneger_core: {
                version: bds.package_json.version,
                server_versions: GetServerVersion(),
            }
        };
        return res.send(info);
    });

    app.get("/log", (req, res) => {
        if (!(existsSync(latest_log))) return res.sendStatus(400);

        let RequestConfig = {format: req.query.format, text: readFileSync(latest_log, "utf8").toString().split("\n").filter(d=>{if (d) return true;return false}).join("\n")}
        if (RequestConfig.format === "html") {
            var text = ""
            for (let log of RequestConfig.text.split("\n")) text += `<div class="BdsCoreLog"><p>${log}</p></div>`;
            res.send(text);
        } else res.json(RequestConfig.text.split("\n"));
    });

    app.all("*", (req, res)=>{
        res.status(400)
        res.send(`<html><div class="">This request does not exist, <a href="${docs.url}/${docs.rest_api}">more information</a></div></html>`)
    });
    const port = (port_api||1932)
    app.listen(port, function (){console.log(`Bds Maneger Core REST API, http port: ${port}`);});
    return true
}

// module exports
module.exports = function (json_config = {api_port: 1932}){
    var port_rest;
    if (json_config.api_port === undefined) port_rest = 1932; else port_rest = json_config.rest_port;
    return api(port_rest)
}
module.exports.api = api
