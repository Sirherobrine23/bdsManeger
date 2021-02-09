module.exports = () => {
    global.bds_log_api_start = true
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    var cors = require('cors');
    app.use(cors());
    const rateLimit = require("express-rate-limit");
    const limiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        message: {
          "status": false,
          "log": "we had an overflow of log requests, please wait 5 minutes."
        },
        statusCode: 200,
        max: 5000 // limit each IP to 5000 requests per windowMs
    });
    app.use(limiter);
    const requestIp = require('request-ip');
    app.use(requestIp.mw())
    app.get("/", (req, res) => {
        if (typeof bds_log_string === 'undefined'){
            if (fs.existsSync(localStorage.getItem("old_log_file"))){
                var text = `${fs.readFileSync(localStorage.getItem("old_log_file"), "utf8")}`
                var log_file = localStorage.getItem("old_log_file")
                var sucess = true
            } else {
                var text = `The server is stopped`
                var sucess = false
            }
        } else {
            var text = bds_log_string
            var log_file = "string"
            var sucess = true
        }
        res.json({
            "sucess": sucess,
            "log": text,
            "log_file": log_file,
            "ip": `${req.clientIp}`,
            "requeset_date": bds.date()
        });
    });
    app.listen(6565);
}
