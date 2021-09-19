const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { GetPaths } = require("../../lib/BdsSettings")
const pretty = require("express-prettify");
const latest_log = resolve(GetPaths("log"), "latest.log")
const docs = require("../../BdsManegerInfo.json").docs;

const app = express();
// Enable if you"re behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set("trust proxy", 1);

app.use(cors());
app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(rateLimit({windowMs: 15 * 60 * 1000, /* 15 minutes */ max: 100 /* limit each IP to 100 requests per windowMs*/ }));
app.use(pretty({always: true, spaces: 2}));
app.use(fileUpload({limits: { fileSize: 512 * 1024 }}));
app.use(require("request-ip").mw());

// Main
let Home = readFileSync(resolve(__dirname, "./html/Home.html"), "utf8").replace(/\{\{([^{^}]+)\}\}/g, (..._b) => eval(_b[1]));
app.get("/", (req, res) => res.send(Home));

// Bds route
app.use("/bds", require("./routes/bds"))
app.use("/players", require("./routes/players"))
app.post("/bds_command", ({res}) => res.redirect("/bds/command"))
app.get("/info", ({ res }) => res.redirect("bds/info"))

// Server Sevices
app.all("/service", ({res}) => res.redirect(`${docs.url}/${docs.rest_api}#disable-basic-services`));

app.get("/log", (req, res) => {
    if (!(existsSync(latest_log))) return res.sendStatus(400);

    let RequestConfig = {format: req.query.format, text: readFileSync(latest_log, "utf8").toString().split("\n").filter(d=>{if (d) return true;return false}).join("\n")}
    if (RequestConfig.format === "html") {
        var text = ""
        for (let log of RequestConfig.text.split("\n")) text += `<div class="BdsCoreLog"><p>${log}</p></div>`;
        res.send(text);
    } else res.json(RequestConfig.text.split("\n"));
});

// V2
app.get("/v2", (req, res) => res.redirect("/v2/bds/info"));
app.use("/v2/bds", require("./v2/routes/bds"))

// module exports
function api(port_api = 1932, callback = function (port){console.log("Bds Maneger Core REST API, http port", port)}){
    const port = (port_api || 1932)
    app.all("*", (req, res)=>{
        res.status(404)
        return res.send(`<html><div class="">This request does not exist, <a href="${docs.url}/${docs.rest_api}">more information</a></div></html>`)
    });
    app.listen(port)
    if (typeof callback === "function") callback(port);
    return port;
}
module.exports = function (apiConfig = {api_port: 1932}, callback = function (port){console.log("Bds Maneger Core REST API, http port", port)}){
    var port_rest = 1932;
    if (typeof apiConfig === "object" && apiConfig.api_port !== undefined) port_rest = apiConfig.api_port;
    else if (typeof apiConfig === "number") port_rest = apiConfig;
    return api(port_rest, callback);
}
module.exports.api = api;

// Export Route
module.exports.BdsRoutes = app;
