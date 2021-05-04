const express = require("express");
const bds = require("../index");
const fs = require("fs");
const path = require("path");
var cors = require("cors");
const rateLimit = require("express-rate-limit");
const token_verify = require("./token_api_check")
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const commandExist = require("../commandExist");
const kerneldetect = require("../linuxDetectKernel");

function api(port_api){
    const app = express();
    // Enable if you"re behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // see https://expressjs.com/en/guide/behind-proxies.html
    // app.set("trust proxy", 1);

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use(fileUpload({
        limits: { fileSize: 512 * 1024 }
    }));
    app.use(cors());
    app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(limiter);
    app.get("/info", (req, res) => {
        const config = bds.get_config()
        var info = {
            "server": {
                "bds_config_version": bds.bds_config.version,
                "world_name": config.world,
                "port": config.portv4,
                "port6": config.portv6,
                "max_players": config.players,
                "whitelist": config.whitelist,
            },
            "running": bds.detect(),
            "bds platform": bds.bds_plataform,
            "system arch": bds.arch,
            "system": process.platform
        }
        if (commandExist("uname")) info["Linux Kernel"] = kerneldetect()
        return res.send(info);
    });
    app.get("/players", (req, res) => {
        const query = req.query,
            status = query.status
        const players_json = JSON.parse(fs.readFileSync(bds.players_files, "utf8"))
        var response;
        if (status === "online") {
            response = []
            for (let index  in players_json){
                const check_online =  players_json[index]
                if (check_online.connected === true) response.push(check_online.player)
            }
        } else if (status === "offline") {
            for (let index  in players_json){
                response = []
                const check_online =  players_json[index]
                if (check_online.connected === false) response.push(check_online.player)
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
                <br><a>Version: ${require(path.resolve(__dirname, "..", "package.json")).version}</a>
            </body>
            <p>
                by <a href="https://github.com/Sirherobrine23">Sirherobrine23</a>
            </p>
        </html>`);
    });
    app.post("/service", (req, res) => {
        const body = req.body
        const command_bds = body.command
        
        var pass = token_verify(body.token)

        if (pass){
            var command_status
            if (command_bds === "start"){
                bds.start()
                command_status = "Bds Started"
            } else if (command_bds === "stop"){
                bds.stop()
                command_status = "Stopping the bds server"
            } else {
                command_status = "no command identified"
            }
            res.send({
                "status": 200,
                "bds_status": command_status
            })
        } else {
            res.send({
                "status": 401,
                "message": `Not authorized: ${body.token}`
            })
        }
    });
    app.post("/bds_download", (req, res) => {
        const body = req.body
        const ver = body.version
        var pass = token_verify(body.token)
        var STA,EMN
        if (pass){
            STA = "wait"
            EMN = bds.download(ver)
        } else {
            STA = "401",
            EMN = "Unauthorized Token"
        }
        res.send({
            "status": STA,
            "message": EMN
        })
    });
    app.post("/upload_world", (req, res) => {
        var pass = token_verify(req.headers.token)
        if (pass){
            var fileWorld;
            console.log(req.files);
            if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send("No files were uploaded.");
            let files = Object.getOwnPropertyNames(req.files)
            
            for (let file of files){
                fileWorld = req.files[file];
                console.log(fileWorld.data);
            }
        } else {
            return res.status(400).send("Token is not valid!");
        }
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
