module.exports = () => {
    global.bds_api_start = true
    const express = require('express');
    const bds = require('../index');
    const fs = require('fs');
    const app = express();
    const path = require('path')
    app.get('/info', (req, res) => {
        const text = fs.readFileSync(LocalStorage.getItem('old_log_file'), 'utf8');
        const versions = bds.version_raw
        for (let v in versions){
            if (text.includes(versions[v])){
                var log_version = versions[v];
            } else {
                v++;
            }
        };
        const config = bds.get_config()
        var json_http = {
            "running": bds.detect(),
            "bds_version": log_version,
            "port": config.server_port,
            "port6": config.server_portv6,
            "world_name": config.level_name,
            "whitelist": config.white_list,
            "xbox": config.online_mode,
            "max_players": config.max_players
        }
        return res.send(json_http);
    });
    app.get('/', (req, res) => {
        return res.send({
            "info": "/info",
            "bds_maneger_API_version": require('../package.json').version,
            "app_version": require(process.cwd()+'/package.json').version
        });
    });
    app.get('/log', function(req, res) {
        const text = fs.readFileSync(LocalStorage.getItem('old_log_file'), 'utf-8')
        res.send({
            "sucess": text,
            "log_file": LocalStorage.getItem('old_log_file'),
            "requeset_date": bds.date()
        });
    });
    const bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: true }));
    app.post('/bds_command', (req, res) => {
        const body = req.body
        const tokens = JSON.parse(fs.readFileSync(path.join(bds.server_dir, "bds_tokens.json"), "utf-8"))
        var pass = false;
        for (let token_verify in tokens) {
            const element = tokens[token_verify].token;
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
    const http_port = '1932'
    app.listen(http_port, () =>{
        console.log(`Bds API port: http://localhost:${http_port}`)
    });
}