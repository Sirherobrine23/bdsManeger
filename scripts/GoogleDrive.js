const fs = require("fs");
const path = require("path")
const {join} = require("path")
const {google} = require("googleapis");
const bds =  require("../index");
const open = require("open")
const express = require("express");
const app = express();
var cors = require("cors");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/credentials.json").then(response => response.json()).then(Google_Drive_creential => {
    function getRadomPort(){
        // const port = (Math.trunc(Math.random() * 10000))
        // if (port > 2555) return getRadomPort()
        // else if (port < 1000) return getRadomPort()
        // else return port
        return 6658
    }
    const CurrentPort = getRadomPort()
    function getGoogleUserCredential(callback){
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
            const redirect = backup_json.installed.redirect_uris[0].split("@PORT_REDIRECT").join(CurrentPort);
            const oAuth2Client = new google.auth.OAuth2(client, secret, redirect);
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: [
                    "https://www.googleapis.com/auth/drive"
                ]
            });
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
                res.send({
                status: "sucess"
                })
            })
            
        })
        const saver = app.listen(CurrentPort)
        open("http://localhost:"+CurrentPort+"/request")
        function close_server(){
            saver.close()
        }
        return CurrentPort
    }
    const TOKEN_PATH = join(bds.bds_dir, "google_user_token.json");
    if (fs.existsSync(join(bds.bds_dir, "google_token.json"))){
        let old_google0user = join(bds.bds_dir, "google_token.json")
        fs.writeFileSync(TOKEN_PATH, fs.readFileSync(old_google0user, "utf8"))
        fs.rmSync(old_google0user)
    }
    function authorize(callback) {
        const client_secret = Google_Drive_creential.installed.client_secret;
        const client_id = Google_Drive_creential.installed.client_id;
        const redirect_uris = Google_Drive_creential.installed.redirect_uris[0].split("@PORT_REDIRECT").join(CurrentPort);
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);

        fs.readFile(TOKEN_PATH, (err, user_cred) => {
        if (err) return getGoogleUserCredential(callback);
        oAuth2Client.setCredentials(JSON.parse(user_cred));
        callback(oAuth2Client);});
    }

    module.exports.drive_backup = () => {
        const file_json = require("./backups").Drive_backup()
        const parent_id = bds.bds_config.Google_Drive_root_backup_id
        const path_file = file_json.file_path
        const name_d = file_json.file_name;
        
        const gd_secret = "";
        console.log(gd_secret)
        function upload_backup(auth) {
            const drive = google.drive({version: "v3", auth});
            var fileMetadata = {
                name: name_d
            }
            if (parent_id === undefined) null
            else if (parent_id === null) null
            else if (parent_id === "") null
            else fileMetadata.parents = [parent_id]
            
            drive.files.create({
                resource: fileMetadata,
                media: {
                    mimeType: "application/octet-stream",
                    body: fs.createReadStream(path_file)
                },
                fields: "id"
            }, function (err, file) {
                if (err) console.error(err)
                else {global.backup_id = file.data.id;console.log(`https://drive.google.com/file/${file.data.id}`);}
            });
        }
        return authorize(upload_backup);
        // End Upload Backup
    };

    module.exports.mcpe = () => {
        global.mcpe_file_end = false;
        function download_mcpe(auth) {
            const drive = google.drive({version: "v3", auth});
            var fileId = "11jJjMZRtrQus3Labo_kr85EgtgSVRPLI";
            var dest = fs.createWriteStream(path.join(bds.tmp_dir, "mcpe.apk"));
            let progress = 0;
            drive.files.get({fileId: fileId, alt: "media"}, {responseType: "stream"},function(err, res){res.data.on("end", () => {
            console.log(`\nDone, Save in ${path.join(bds.tmp_dir, "mcpe.apk")}`);
            global.mcpe_file_end = true;
            }).on("error", err => {
            console.log("\nError", err)
            global.mcpe_file_end = undefined;
            }).on("data", d => {
                progress += d.length / 1024 / 1024;
                if (process.stdout.isTTY) {process.stdout.clearLine();process.stdout.cursorTo(0);process.stdout.write(`Downloaded ${Math.trunc(progress)} Mbytes`);}
            }).pipe(dest)});
        }
        return authorize(download_mcpe);
    }
})

