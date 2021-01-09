module.exports = () => {
    global.bds_api_start = true
    const express = require('express');
    const bds = require('../index');
    const fs = require('fs');
    const app = express();
    const text = fs.readFileSync(bds.Storage().getItem('old_log_file'), 'utf8');
    const versions = bds.version_raw
    for (let v in versions){
        if (text.includes(versions[v])){
            var log_version = versions[v];
        } else {
            v++;
        }
    };
    app.get('/status', (req, res) => {
        const config = bds.get_config()
        var json_http = {
            "running": bds.detect(),
            "bds_version": log_version,
            "port": config.server_port,
            "port6": config.server_portv6,
            "world_name": config.level_name,
            "whitelist": config.whitelist,
            "xbox_account": config.online_mode,
            "max_players": config.max_players
        }
        return res.send(json_http);
    });
    const http_port = '1932'
    app.listen(http_port, () =>{
        console.log(`Bds API port: ${http_port}`)
    });
}