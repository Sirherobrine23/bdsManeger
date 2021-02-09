module.exports = () => {
    global.bds_api_start = true;
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    const path = require("path");
    var cors = require("cors");
    const rateLimit = require("express-rate-limit");

    // Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // see https://expressjs.com/en/guide/behind-proxies.html
    // app.set('trust proxy', 1);

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use(cors());
    app.use(require("body-parser").json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.use(limiter);
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({ extended: true }));
    app.get("/configs", (req, res) => {
        return res.send(bds.get_config());
    });
    app.get("/info", (req, res) => {
        const text = fs.readFileSync(localStorage.getItem("old_log_file"), "utf8");
        const versions = bds.version_raw
        for (let v in versions){
            if (text.includes(versions[v])){
                var log_version = versions[v];
            } else {
                v++;
            }
        }
        const config = bds.get_config()
        var json_http = {
            "server": {
                "bds_version": log_version,
                "port": config.server_port,
                "port6": config.server_portv6,
                "world_name": config.level_name,
                "whitelist": config.white_list,
                "xbox": config.online_mode,
                "max_players": config.max_players
            },
            "running": bds.detect(),
            "bds_platform": bds.bds_plataform,
            "system_arch": process.arch
        }
        return res.send(json_http);
    });
    app.get("/", (req, res) => {
        return res.send(`Hello, welcome to the Bds Maneger API, If this page has loaded it means that the API is working as planned, More information access the API documentation at: https://docs.srherobrine23.com/bds-maneger-api_whatis.html, Version: ${require(path.join(__dirname, "..", "package.json")).version}`);
    });
    app.post("/service", (req, res) => {
        const body = req.body
        const command_bds = body.command
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.bds_dir, "bds_tokens.json"), "utf8"))
        var pass = false;
        for (let token_verify in tokens) {
            const element = tokens[token_verify].token;
            if (body.token == element){
                pass = true
            } else {
                token_verify++
            }
        }
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
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.bds_dir, "bds_tokens.json"), "utf8"))
        var pass = false;
        for (let token_verify in tokens) {
            const element = tokens[token_verify].token;
            if (body.token == element){
                pass = true
            } else {
                token_verify++
            }
        }
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
    app.post("/bds_command", (req, res) => {
        const body = req.body
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.bds_dir, "bds_tokens.json"), "utf8"))
        var pass = false;
        for (let token_verify in tokens) {
            const element = tokens[token_verify].token;
            // req.connection.remoteAddress
            if (body.token == element){pass = true} else {token_verify++}
        }
        if (pass){
            const command = body.command
            const teste = bds.command(command)
            res.send({
                "status": 200,
                "command": body.command,
                "log": teste,
                "message": `authorized to ${body.token}`
            })
        } else {
            res.send({
                "status": 401,
                "message": "not authorized"
            })
        }
    });    
    app.listen(1932);
}
