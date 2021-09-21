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

// Bds route
app.use("/bds", require("./routes/bds"))
app.use("/players", require("./routes/players"))
app.post("/bds_command", ({res}) => res.redirect("/bds/command"))
app.get("/info", ({ res }) => res.redirect("bds/info"))

// Server Sevices
app.all("/service", ({res}) => res.redirect(`${docs.url}/${docs.rest_api}#disable-basic-services`));

app.get("/log", (req, res) => {
    if (!(existsSync(latest_log))) return res.sendStatus(400);
    let RequestConfig = {format: req.query.format, text: readFileSync(latest_log, "utf8").toString().split(/\r\n|\n/gi).filter(d => d).join("\n")};
    if (RequestConfig.format === "html") {
        var text = ""
        for (let log of RequestConfig.text.split(/\r\n|\n/gi)) text += `<div class="BdsCoreLog"><p>${log}</p></div>`;
        res.send(text);
    } else res.json(RequestConfig.text.split(/\r\n|\n/gi));
});

// V2
const BdsV2 = require("./v2/routes/bds"), PlayerV2 = require("./v2/routes/player");
app.use("/v2", BdsV2);
app.get("/v2", (req, res) => res.redirect("/v2/info"));
app.all("/", ({res}) => res.redirect("/v2/info"));
app.all("/v2/bds/*", (req, res) => res.redirect(`/v2/${req.path.replace("/v2/bds/", "")}`));
app.use("/v2/players", PlayerV2);

// module exports
function api(port_api = 1932, callback = function (port){console.log("Bds Maneger Core REST API, http port", port)}){
    const port = (port_api || 1932);
    const MapRoutes = app._router.stack.map(d => {if (d.route) {if (d.route.path) return d.route.path; else return d.route.regexp.source;} else return null;}).filter(d => d);
    MapRoutes.push(...PlayerV2.APIPaths.map(Player => ("/v2/players"+ Player)));
    MapRoutes.push(...BdsV2.APIPaths.map(Bds => ("/v2/bds"+ Bds)));
    app.all("*", (req, res)=>{
        res.status(404).json({
            error: "Not Found",
            message: "The requested URL " + req.originalUrl + " was not found on this server.",
            AvaibleRoutes: MapRoutes,
            MoreInfo: `${docs.url}/${docs.rest_api}`
        });
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
