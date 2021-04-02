const fs = require("fs");
const path = require("path")
const {google} = require("googleapis");
const bds =  require("../index");
require("./GoogleDriveAuth")
module.exports.drive_backup = () => {
    const authorize = require("./GoogleDriveAuth").authorize
    const file_json = require("./backups").Drive_backup()
    const parent_id = bds.bds_config.Google_Drive_root_backup_id
    
    return authorize(function (auth) {
        const drive = google.drive({version: "v3", auth});
        const UploadFile = {
            resource: {
                name: file_json.file_name
            },
            media: {
                mimeType: "application/octet-stream",
                body: fs.createReadStream(file_json.file_path)
            },
            fields: "id"
        }
        if (parent_id === undefined) null;
        else if (parent_id === null) null;
        else if (parent_id === "") null;
        else UploadFile.resource.parents = [parent_id];

        drive.files.create(UploadFile, function (err, file) {
            if (err) throw Error(err)
            else {
                global.backup_id = file.data.id;
                console.log(`https://drive.google.com/file/${file.data.id}`);
            }
        });
    });
    // End Upload Backup
};

module.exports.mcpe = () => {
    const authorize = require("./GoogleDriveAuth").authorize
    return authorize(function (auth) {
        const drive = google.drive({version: "v3", auth});
        var fileId = "11jJjMZRtrQus3Labo_kr85EgtgSVRPLI";
        const SaveAPKintmp = path.join(bds.tmp_dir, "mcpe.apk")
        var dest = fs.createWriteStream(SaveAPKintmp);
        drive.files.get({fileId: fileId, alt: "media"}, {responseType: "stream"},function(err, res){res.data.on("end", () => {
            console.log(`Done, Save in ${SaveAPKintmp}`);
        }).on("error", err => {
            console.error(`Error: ${err}`)
        }).pipe(dest)});
    });
}