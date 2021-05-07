const express = require("express");
const bds = require("../index");
const fs = require("fs");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const token_verify = require("./token_api_check")
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const kerneldetect = require("../DetectKernel");
const commandExist = require("../commandExist");
const { join } = require("path");
const bdsPaths = require("../bdsgetPaths")
const admzip = require("adm-zip")

function api(port_api){
    const app = express();
    // Enable if you"re behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // see https://expressjs.com/en/guide/behind-proxies.html
    // app.set("trust proxy", 1);

    app.use(cors());
    app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }));
    app.get("/info", (req, res) => {
        const config = bds.get_config();
        var info = {
            version: bds.package_json.version,
            server: {
                platform: bds.platform,
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
                Kernel: kerneldetect(),
                IS_CLI: JSON.parse(process.env.IS_BDS_CLI || false),
                IS_DOCKER: JSON.parse(process.env.BDS_DOCKER_IMAGE || false),
                IS_NPX: (process.env.npm_lifecycle_event === "npx"),
                QEMU_STATIC: {
                    "x64": commandExist("qemu-x86_64-static"),
                    "x86": commandExist("qemu-i386-static"),
                }
            },
            bds_maneger_core: {
                server_versions: bds.bds_config.platform_version,
                server_ban: bds.bds_config.bds_ban,
                telegram_admin: bds.bds_config.telegram_admin
            }
        };
        return res.send(info);
    });
    app.get("/players", (req, res) => {
        const query = req.query;
        const players_json = JSON.parse(fs.readFileSync(bds.players_files, "utf8"))[(query.platform || bds.platform)];
        var response = {};
        
        if (query.status) {
            const status = (() => {if (query.status === "online") return true; else return false})()
            for (let index of Object.getOwnPropertyNames(players_json)){
                if (players_json[index].connected === status) {
                    response[index] = players_json[index]
                }
            }
        } else response = players_json
        res.json(response);
    });
    
    app.get("/download_backup", (req, res) => {
        const query = req.query
        if (token_verify(query.token)){
            const backup = bds.backup()
            res.sendFile(backup.file_path)
        } else res.json({
            "token": (query.token||null),
            "status": 404
        })
    });
    app.get("/", (req, res) => {
        return res.send(`<html>
            <body>
                <h1>Hello From Bds Maneger Core</h1>
                <a>If this page has loaded it means that the API is working as planned, More information access the API documentation at: <a href="https://github.com/The-Bds-Maneger/core/wiki">Bds Maneger Core</a>. </a>
                <p><span>Bds Maneger core Version: ${bds.package_json.version}</span></p>
                <p><h3>GET</h3></p>
                <p><a href="/info">Basic Info server and System</a></p>
                <p><a href="/players">Players who logged on to the server</a></p>
                <p><h3>POST</h3></p>
                <p><a href="/service">basic Services: Stop, start and restart</a></p>
            </body>
            <p>by <a href="https://github.com/Sirherobrine23">Sirherobrine23</a></p>
        </html>`);
    });
    app.all("/service", (req, res) => {
        const body = (() => {if (req.body && (Object.getOwnPropertyNames(req.body).length >= 1)) return req.body;else return req.query})()
        const argV0 = process.argv0.split(/\\\\/).join("/").split(/\//)[process.argv0.split(/\\\\/).join("/").split(/\//).length -1];
        const JsonReturn = {
            text: `Not authorized: ${body.token}`,
            httpStatus: 401
        }
        if (token_verify(body.token)){
            if (body.command === "start"){
                if (argV0 === "node") {
                    if (JSON.parse(process.env.IS_BDS_CLI || false) || (process.env.npm_lifecycle_event === "npx")) {
                        const start = bds.start()
                        start.stdout.on("data", data => console.log(data))
                        start.stderr.on("data", data => console.log(data))
                        JsonReturn.httpStatus = 200
                        JsonReturn.text = "Started"
                    } else {
                        JsonReturn.httpStatus = 400
                        JsonReturn.text = "We can't start"
                    }
                } else {
                    JsonReturn.httpStatus = 400
                    JsonReturn.text = "It is not a node process"
                }
            } else if (body.command === "stop"){
                bds.stop()
                JsonReturn.httpStatus = 200
                JsonReturn.text = "Started"
            } else {
                JsonReturn.httpStatus = 406
                JsonReturn.text = "Command does not exist"
            }
        }
        res.status(JsonReturn.httpStatus).send(`Text: ${encodeURI(JsonReturn.text)}`)
    });
    app.all("/bds_download", (req, res) => {
        const body = req.body
        const status = {
            "status": null,
            "message": null
        }
        if (token_verify(body.token)){
            status.message = bds.download(body.version)
            status.status = 200
        } else {
            status.message = "Unauthorized Token"
            status.status = 401
        }
        res.send(status)
    });

    app.use(fileUpload({limits: { fileSize: 512 * 1024 }}));
    app.post("/upload_world", (req, res) => {
        if (token_verify(req.headers.token)){
            if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send("No files were uploaded.");
            for (let index of Object.getOwnPropertyNames(req.files)){
                const fileWorld = req.files[index];
                const BufferWorld = Buffer.from(req.files[index].data);
                const unzip = new admzip(BufferWorld);
                for (let index of unzip.getEntries()){
                    if (index.name === "config.json") {
                        const loadConfig = JSON.parse(index.getData().toString())
                        console.log(`To: ${loadConfig.to}`);
                        unzip.extractAllTo(join(bdsPaths.tmp_dir, fileWorld.name))
                        for (let world of loadConfig.worlds) {
                            fs.renameSync(join(bdsPaths.tmp_dir, fileWorld.name, world), join(bdsPaths.bds_dir, loadConfig.to))
                        }
                    }
                }
            }
            res.send("Ok")
        } else res.status(400).send("Token is not valid!");
    });
    app.get("*", (req, res) => {
        return res.status(404).json(["Not Found"]);
    });
    const port = (port_api||1932)
    app.listen(port, function (){
        console.log(`bds maneger api http port: ${port}`);
    });
    return true
}

function log(port_log){
    const app = express();
    app.use(cors());
    const limiter = rateLimit({
        windowMs: 500,
        message: {
            "status": false,
            "log": "we had an overflow of log requests, please wait."
        },
        statusCode: 200,
        max: 5000 // limit each IP to 5000 requests per windowMs
    });
    app.use(limiter);
    const requestIp = require("request-ip");
    app.use(requestIp.mw())
    app.get("/", (req, res) => {
        let format = req.query.format
        var text="";
        var log_file="";
        var sucess="";
        if (typeof bds_log_string === "undefined"){
            if (fs.existsSync(bds.latest_log)){
                text = `${fs.readFileSync(bds.latest_log)}`
                log_file = bds.latest_log
                sucess = true
            } else {
                text = "The server is stopped"
                sucess = false
            }
        } else {
            text = bds_log_string
            log_file = "string"
            sucess = true
        }
        if (format === "json") res.json(text.split("\n"));
        else if (format === "html") res.send(text.split("\n").join("<br>"));
        else if (format === "plain") res.send(text);
        else res.json({
            "sucess": sucess,
            "log": text,
            "log_file": log_file,
            "ip": `${req.clientIp}`,
            "requeset_date": bds.date()
        });
        
    });
    const port = (port_log||6565)
    app.listen(port, function(){
        console.log(`bds maneger log http, port: ${port}`)
    });
    return true
}

// module exports
module.exports = function (json_config){
    var port_rest, port_log
    if (json_config === undefined) json_config = {};
    if (json_config.log_port === undefined) port_log = 6565; else port_log = json_config.log_port;
    if (json_config.rest_port === undefined) port_rest = 1932; else port_rest = json_config.rest_port;
    return {
        rest: api(port_rest),
        log:  log(port_log)
    }
}
module.exports.api = api
module.exports.log = log
