module.exports = () => {
    global.bds_api_start = true
    const express = require('express');
    const bds = require('../index');
    const fs = require('fs');
    const app = express();
    const bodyParser = require('body-parser');
    // create application/json parser
    var jsonParser = bodyParser.json()
    
    // create application/x-www-form-urlencoded parser
    var urlencodedParser = bodyParser.urlencoded({ extended: false })
    app.get('/info', (req, res) => {
        const text = fs.readFileSync(bds.Storage().getItem('old_log_file'), 'utf8');
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
    app.param('name', function(req, res, next, name) {req.name = name;next();});
    app.get('/user/:name', function(req, res) {
        const text = fs.readFileSync(bds.Storage().getItem('old_log_file'), 'utf-8')
        if(text.includes(req.name)){
            var texts = true
        } else {
            var texts = false
        }
        res.send({
            "sucess": texts,
            "log_file": bds.Storage().getItem('old_log_file'),
            "requeset_date": bds.date()
        });
    });
    app.param('token', function(req, res, next, token) {req.token = token;next();});
    app.param('text', function(req, res, next, text) {req.text = text;next();});
    app.get('/remote/:token/:text', jsonParser, function (req, res) {
        if (req.token == 'teste'){
            const token = JSON.parse(fs.readFileSync(bds.server_dir+'/whitelist.json', "utf-8"))
            res.send({
                "token": req.token,
                "text": token
            })
        } else {
            res.send({
                "mensagem": "Token not autorized"
            })
        }
        
    })
    app.use(bodyParser.urlencoded({ extended: true }));

    app.post('/remote', (req, res) => {
        console.log('Got body:', req.body);
        const body = req.body
        res.send({
            "status": true,
            "name": Math.random(),
            "text": body.text
        })
    });
    const http_port = '1932'
    app.listen(http_port, () =>{
        console.log(`Bds API port: http://localhost:${http_port}`)
    });
}