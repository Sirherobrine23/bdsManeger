const fs = require("fs");
const {join} = require("path")
const {google} = require("googleapis");
const bds =  require("../index");
const express = require("express");
const app = express();
var cors = require("cors");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const externalIP = require("./external_ip").ip
const internal_ip = require("./external_ip").internal_ip
// const readline = require("readline")
module.exports.authorize = undefined

// -------------------------------------------------------------
const TOKEN_PATH = join(bds.bds_dir, "google_user_token.json");

// Rename Old File
if (fs.existsSync(TOKEN_PATH)) fs.renameSync(TOKEN_PATH, join(bds.bds_dir, "google_token.json"))

const DefaultLoginDrive = {
    access_type: "offline",
    scope: [
        "https://www.googleapis.com/auth/drive"
    ]
}


function expressGetGoogleDriveToken(callback, Google_Drive_creential){
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
        const backup_json = Google_Drive_creential
        const user_save_json = TOKEN_PATH
        const secret = backup_json.installed.client_secret;
        const client = backup_json.installed.client_id;
        const redirect = backup_json.installed.redirect_uris[0].split("@PORT_REDIRECT").join(6658);
        const oAuth2Client = new google.auth.OAuth2(client, secret, redirect);
        const authUrl = oAuth2Client.generateAuthUrl(DefaultLoginDrive);
        res.redirect(authUrl)
        app.get("/save", (req, res) => {
            // http://localhost:6899/save?code=********************************************************************&scope=https://www.googleapis.com/auth/drive
            const code = req.query.code
            oAuth2Client.getToken(code, (err, save_token) => {
                if (err) return console.error("Error accessing keys and saving, Error:", err);
                oAuth2Client.setCredentials(save_token);
                fs.writeFile(user_save_json, JSON.stringify(save_token, null, 2), function (err){
                if (err) return console.error("We were unable to save json, please try again later")
                callback(oAuth2Client);
                close_server()
                });
            })
            res.send({status: "sucess"})
        });
    })
    const saver = app.listen(6658)
    function close_server() {saver.close()}
    return 6658
}

/* function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl(DefaultLoginDrive);
    require("open")(authUrl)
    console.log(`Open the link to authorize the bds core to upload backup files and download mcpe.apk: ${authUrl}`);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error("Error retrieving access token", err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log("Token stored to", TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
} */

fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/credentials.json").then(response => response.json()).then(Google_Drive_creential => {
    function authorize(callback) {
        const client_secret = Google_Drive_creential.installed.client_secret;
        const client_id = Google_Drive_creential.installed.client_id;
        const redirect_uris = Google_Drive_creential.installed.redirect_uris[0].split("@PORT_REDIRECT").join(6658);
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);

        fs.readFile(TOKEN_PATH, (err, user_cred) => {
            if (err) {
                var GetReturn;
                    if (process.argv[0].includes("electron")) {GetReturn = expressGetGoogleDriveToken(callback, Google_Drive_creential); open("http://localhost:6658/request")}
                    else if (process.argv[0].includes("node")) {
                        GetReturn = expressGetGoogleDriveToken(callback, Google_Drive_creential);
                        console.log("Open one of these links in your browser:");
                        console.log("http://localhost:6658/request");
                        console.log(`http://${externalIP}:6658/request`);
                        for (let index in internal_ip){
                        console.log(`http://${internal_ip[index]}:6658/request`)}
                    }
                return GetReturn
            }
            oAuth2Client.setCredentials(JSON.parse(user_cred));
            callback(oAuth2Client);});
    }

    /**
     * Callback Google Drive
     */
    module.exports.authorize = authorize
})

