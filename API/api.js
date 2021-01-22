module.exports = () => {
    global.bds_api_start = true
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    const path = require("path")
    var cors = require('cors');
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
    app.get("/info", (req, res) => {
        const text = fs.readFileSync(localStorage.getItem("old_log_file"), "utf8");
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
        return res.send(`Hello, welcome to the Bds Maneger API, If this page has loaded it means that the API is working as planned, More information access the API documentation at: https://docs.srherobrine23.com/bds-maneger-api_whatis.html, Version: ${require(__dirname+'/../package.json').version}`);
    });
    app.get("/themes", (req, res) => {
        fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/themes.json").then(response => response.json()).then(array => {
            var themes_json;
            for (let index = 0; index < array.length; index++) {
                const name = array[index].name;
                const zip_url = array[index].zip_url;
                const git_url = array[index].git_url;
                themes_json += `{Name: ${name},\n Url Zip: ${zip_url},\n Git url: ${git_url}},`
            }
            return res.send(themes_json);
        });
    });
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({ extended: true }));
    
    const http_port = "1932"
    app.listen(http_port);
}