module.exports = () => {
    global.bds_api_post_start = true
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    var cors = require('cors');
    const path = require("path")
    const bodyParser = require("body-parser");
    const rateLimit = require("express-rate-limit");

    // Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // see https://expressjs.com/en/guide/behind-proxies.html
    // app.set('trust proxy', 1);

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use(cors());
    app.use(limiter);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(require("body-parser").json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.post("/info", (req, res) => {
        const body = req.body
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.bds_dir, "bds_tokens.json"), "utf-8"))
        var pass = false;
        var teste = 'Sucess'
        for (let token_verify in tokens) {const element = tokens[token_verify].token;if (body.token == element){pass = true} else {token_verify++}}
        if (pass){
            if (fs.existsSync(process.cwd()+"/package.json")){
                var api_v = require(process.cwd()+"/package.json").version
                var name = bds.get_config().level_name
            } else {
                var api_v = null
                var name = 'Bds_Maneger_api'
            }
            res.send({
                "status": 200,
                "api_version": api_v,
                "name": name
            })
        } else {
            res.send({
                "status": 401,
                "message": `Not authorized: ${body.token}`
            })
        }
    });
    app.get("/bds/:command", (req, res) => {
        const body = req.body
        const command_bds = '';
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.bds_dir, "bds_tokens.json"), "utf-8"))
        var pass = false;
        res.send({
            "command": req.params.command
        })
        // for (let token_verify in tokens) {const element = tokens[token_verify].token;if (body.token == element){pass = true} else {token_verify++}}
        // if (pass){
        //     if (command_bds === 'start'){
        //         var bds_init = bds.start()
        //         var command_status = `Bds Started`
        //     } else if (command_bds === 'stop'){
        //         bds.stop()
        //         var command_status = `Stopping the bds server`
        //     } else if (command_bds === 'reload'){
        //         const bds_status = bds.detect()
        //         if (bds_detect){
        //             bds.stop()
        //         }
        //         var bds_init = bds.start()
        //         var command_status = `Reloading`
        //     } else {
        //         var command_status = `no command identified`
        //     }
        //     res.send({
        //         "status": 200,
        //         "bds_status": command_status
        //     })
        // } else {
        //     res.send({
        //         "status": 401,
        //         "message": `Not authorized: ${body.token}`
        //     })
        // }
    });
    app.post("/bds_command", (req, res) => {
        const body = req.body
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.bds_dir, "bds_tokens.json"), "utf-8"))
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
    const http_port = "28574"
    app.listen(http_port);
}