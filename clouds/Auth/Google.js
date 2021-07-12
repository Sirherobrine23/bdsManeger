const fs = require("fs");
const { join } = require("path")
const { google } = require("googleapis");
const { bds_dir } = require("../../lib/BdsSettings")
const express = require("express");
const app = express();
var cors = require("cors");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const fetchSync = require("@the-bds-maneger/fetchsync");
const Ips = require("../../scripts/external_ip")
const DefaultLoginDrive = {
    access_type: "offline",
    scope: [
        "https://www.googleapis.com/auth/drive"
    ]
}
const GoogleDriveCredentials = fetchSync("https://raw.githubusercontent.com/Bds-Maneger/external_files/main/credentials.json").json()
// -------------------------------------------------------------
const PathToToken = join(bds_dir, "google_user_token.json");

function expressGetGoogleDriveToken(callback){
    // Settings
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(limiter);
    app.use(cors());
    // Urls
    app.get("/request", (req, res) => {
        const secret = GoogleDriveCredentials.installed.client_secret;
        const client = GoogleDriveCredentials.installed.client_id;
        const redirect = `${req.protocol}://${req.headers.host}/save`;
        const oAuth2Client = new google.auth.OAuth2(client, secret, redirect);
        res.redirect(oAuth2Client.generateAuthUrl(DefaultLoginDrive))
        app.get("/save", (req, res) => {
            // http://localhost:6899/save?code=********************************************************************&scope=https://www.googleapis.com/auth/drive
            const code = req.query.code
            oAuth2Client.getToken(code, (err, save_token) => {
                if (err) return console.error("Error accessing keys and saving, Error:", err);
                oAuth2Client.setCredentials(save_token);
                // Save Token File
                fs.writeFile(PathToToken, JSON.stringify(save_token, null, 4), function (err){
                    if (err) {
                        console.error("We were unable to save json, please try again later");
                        return close_server();
                    }
                        
                    callback(oAuth2Client);
                    res.json({
                        "token": save_token,
                        status: "success"
                    })
                    close_server();
                });
            });
        });
        app.get("*", (req, res)=>{res.redirect("/request")});
    })
    const saver = app.listen(6658)
    function close_server() {saver.close()}
    return 6658
}

module.exports.authorize = function (callback) {
    const client_secret = GoogleDriveCredentials.installed.client_secret;
    const client_id = GoogleDriveCredentials.installed.client_id;
    const redirect_uris = GoogleDriveCredentials.installed.redirect_uris[0].split("@PORT_REDIRECT").join(6658).split("@URLREDIRECT").join("localhost");
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);
    fs.readFile(PathToToken, (err, user_cred) => {
        if (err) {
            var GetReturn = expressGetGoogleDriveToken(callback);
            if (process.argv0 === "electron") open("http://localhost:6658/request")
            console.log("Open one of these links in your browser:");
            console.log("http://localhost:6658/request");
            for (let index of Ips.internal_ip) console.log(`http://${index}:6658/request`)
            return GetReturn
        }
        oAuth2Client.setCredentials(JSON.parse(user_cred));
        callback(oAuth2Client);
    });
}