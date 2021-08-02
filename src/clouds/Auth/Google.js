const fs = require("fs");
const { join } = require("path")
const { randomUUID } = require("crypto");
const express = require("express");
const { google } = require("googleapis");

const ip_andress = require("../../external_ip");
const { bds_dir } = require("../../../lib/BdsSettings");

const PathToToken = join(bds_dir, "google_user_token.json");

// Urls
global.GoogleAuth = {}

async function LoadExpress(GoogleDriveCredentials, app = express(), closer = express().listen(1221)){
    return new Promise((resolve => {
        app.get("/request", (req, res) => {
            const SessionUUID = randomUUID();
            const secret = GoogleDriveCredentials.installed.client_secret;
            const client = GoogleDriveCredentials.installed.client_id;
            const redirect = `${req.protocol}://${req.headers.host}/${SessionUUID}/save`;
            const oAuth2Client = new google.auth.OAuth2(client, secret, redirect);
            global.GoogleAuth[SessionUUID] = oAuth2Client;
            res.redirect(oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: [
                    "https://www.googleapis.com/auth/drive"
                ]
            }));
        });
        app.get("/:SessionUUID/save", (req, res) => {
            const { code } = req.query;
            const { SessionUUID } = req.params;
            // http://localhost:6899/save?code=********************************************************************&scope=https://www.googleapis.com/auth/drive
        
            const oAuth2Client = global.GoogleAuth[SessionUUID];
            oAuth2Client.getToken(code, (err, save_token) => {
                if (err) return console.error("Error accessing keys and saving, Error:", err);
                oAuth2Client.setCredentials(save_token);
                // Save Token File
                fs.writeFile(PathToToken, JSON.stringify(save_token, null, 4), function (err){
                    if (err) {
                        console.error("We were unable to save json, please try again later");
                        return closer();
                    }
                    res.json({
                        "token": save_token,
                        status: "success"
                    })
                    closer.close()
                    resolve(oAuth2Client);
                });
            });
        });
        app.all("*", ({res}) => res.redirect("/request"));
    }));
}

function RandomPort(){
    let Port = parseInt(Math.random().toString().replace(/[01]\./, "").slice(0, 4));
    if (Port > 1024 && Port < 2542) return Port; else return RandomPort();
}

async function authorize() {
    return new Promise(async resolve => {
        const GoogleDriveCredentials = (await (await fetch("https://raw.githubusercontent.com/The-Bds-Maneger/external_files/main/Credentials/Google.json")).json())
        const client_secret = GoogleDriveCredentials.installed.client_secret;
        const client_id = GoogleDriveCredentials.installed.client_id;
        const redirect_uris = "http://localhost:1932/SaveToken"
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);
        fs.readFile(PathToToken, async (err, user_cred) => {
            if (err) {
                const app = express();
                app.use(require("body-parser").json());
                app.use(require("body-parser").urlencoded({ extended: true }));
                app.use(require("express-rate-limit")({windowMs: 1 * 60 * 1000, max: 100}));
                app.use(require("cors")());
                const port = RandomPort()
                ip_andress.internal_ip.forEach(ips => {
                    let { ipv4, ipv6 } = ips.Interna_IP;
                    console.log(`Open: http://${ipv4}:${port}/request`);
                    if (ipv6) console.log(`Open: http://[${ipv6}]:${port}/request`);
                });

                // Return auth
                const AuthToken = await LoadExpress(GoogleDriveCredentials, app, app.listen(port));
                resolve(AuthToken);
            } else {
                oAuth2Client.setCredentials(JSON.parse(user_cred));
                resolve(oAuth2Client);
            }
        });
    });
}

module.exports = {
    authorize,
}