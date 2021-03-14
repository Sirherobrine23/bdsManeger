module.exports = () => {
    global.bds_api_start = true;
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    const path = require("path");
    var cors = require("cors");
    const rateLimit = require("express-rate-limit");
    const token_verify = require("./token_api_check")

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
    app.get("/configs", (req, res) => {return res.send(bds.get_config());/* end */});
    app.get("/info", (req, res) => {
        const config = bds.get_config()
        var json_http = {
            "server": {
                "bds_version": bds.bds_config,
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
    app.get("/players", (req, res) => {
        return res.send(fs.readFileSync(bds.api_dir));
    });
    app.get("/", (req, res) => {
        return res.send(`<html>
            <body>
                <h1>Hello From Bds Maneger Core</h1>
                <a>If this page has loaded it means that the API is working as planned, More information access the API documentation at: <a href="https://docs.srherobrine23.com/bds-maneger-api_whatis.html">Bds Maneger Core</a>. </a>
                <br><a>Version: ${require(path.resolve(__dirname, "..", "package.json")).version}</a>
            </body>
            <header>
                by Sirherobrine23
            </header>
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
    app.post("/bds_command", (req, res) => {
        const body = req.body
        var pass = token_verify(body.token)
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

module.exports.log = () => {
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    var cors = require("cors");
    app.use(cors());
    const rateLimit = require("express-rate-limit");
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
    app.listen(6565);
    return app
}
