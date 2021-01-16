module.exports = () => {
    global.bds_api_start = true
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    var cors = require('cors'); 
    const path = require("path")
    const bodyParser = require("body-parser");
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(require("body-parser").json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.post("/info", (req, res) => {
        const body = req.body
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.server_dir, "bds_tokens.json"), "utf-8"))
        var pass = false;
        var teste = 'Sucess'
        for (let token_verify in tokens) {const element = tokens[token_verify].token;if (body.token == element){pass = true} else {token_verify++}}
        if (pass){
            if (fs.existsSync(process.cwd()+"/package.json")){
                var api_v = require(process.cwd()+"/package.json").version
                var name = require(process.cwd()+"/package.json").name
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
    const http_port = "28574"
    app.listen(http_port);
}