module.exports = () => {
    global.bds_log_api_start = true
    const express = require("express");
    const bds = require("../index");
    const fs = require("fs");
    const app = express();
    var cors = require('cors');
    app.use(cors());
    app.use(require("body-parser").json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.get("/", (req, res) => {
        if (typeof bds_log_string === 'undefined'){
            var text = 'The server is stopped';
            var sucess = false
        } else {
            var text = bds_log_string
            var sucess = true
        }
        res.json({
            "sucess": sucess,
            "log": text,
            "log_file": localStorage.getItem("old_log_file"),
            "requeset_date": bds.date()
        });
    });
    const http_port = "6565"
    app.listen(http_port);
}
