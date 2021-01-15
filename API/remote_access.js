module.exports = () => {
    global.bds_api_start = true
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    const path = require("path")
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({ extended: true }));
    app.post("/remote", (req, res) => {
        const body = req.body
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.server_dir, "bds_tokens.json"), "utf-8"))
        var pass = false;
        for (let token_verify in tokens) {
            const element = tokens[token_verify].token;
            // req.connection.remoteAddress
            if (body.token == element){pass = true} else {token_verify++}
        }
        if (pass){
            const command = body.command
            eval(command)
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
    app.listen(http_port, () =>{
        console.log(`Bds Maneger remote Access port: http://localhost:${http_port}`)
    });
}