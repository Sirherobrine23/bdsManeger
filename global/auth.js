const fs = require("fs");
const path = require("path")
const readline = require("readline");
const {google} = require("googleapis");
const bds =  require("../index");
const open = require("open")
const TOKEN_PATH = path.join(bds.bds_dir, "google_token.json");


function authorize(credentials, callback) {
  const gd = JSON.parse(require("../index").google_drive_credential);
  const client_secret = gd.installed.client_secret;
  const client_id = gd.installed.client_id;
  const redirect_uris = gd.installed.redirect_uris;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);});
}
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  open(authUrl)
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
}

module.exports.drive_backup = () => {
  const file_json = require("../scripts/backups").Drive_backup()
  console.log(file_json)
  const parent_id = file_json.id
  const path_file = file_json.file_path
  const name_d = file_json.file_name;
  
  const gd_secret = "";
  console.log(gd_secret)
  function upload_backup(auth) {
    const drive = google.drive({version: "v3", auth});
    var fileMetadata;
    if (parent_id === undefined){
      fileMetadata = {
        name: name_d
      }
      console.log("Your backup will be saved to My Drive")
    } else {
      fileMetadata = {
        name: name_d,
        parents: [parent_id]
      }
    }
    var media = {
      mimeType: "application/octet-stream",
      body: fs.createReadStream(path_file)
    }
    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id"
    }, function (err, file) {
      if (err) console.error(err)
      else {global.backup_id = file.data.id;console.log("File: ", file.data.id);}
    });
  }
  return authorize(gd_secret, upload_backup);
  // End Upload Backup
};

module.exports.mcpe = () => {
  const gd_secret = JSON.parse(require("../index").google_drive_credential)
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
  return authorize(gd_secret, download_mcpe);
}
