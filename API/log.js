module.exports = () => {
    global.bds_log_api_start = true
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    var cors = require('cors');
    app.use(cors());
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
            "requeset_date": bds.date()
        });
    });
    app.listen(6565);
}
