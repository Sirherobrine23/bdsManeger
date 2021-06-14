const fs = require("fs");
const path = require("path")
const {google} = require("googleapis");
const bds =  require("../index");
require("./GoogleDriveAuth")
const { authorize } = require("./GoogleDriveAuth");
const { tmp_dir } = require("../lib/bdsgetPaths");

module.exports.drive_backup = (BackupCallback) => {
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
        if (!(parent_id === undefined || parent_id === null || parent_id === "")) UploadFile.resource.parents = [parent_id];
        drive.files.create(UploadFile, (err, file) => {
            if (err) throw Error(err)
            else {
                console.log(`File URL: https://drive.google.com/file/d/${file.data.id}/`);
                if (typeof BackupCallback === "function") BackupCallback(file);
            }
        });
    });
    // End Upload Backup
};

module.exports.mcpe = function () {
    return authorize(function (auth) {
        const drive = google.drive({version: "v3", auth});
        const SaveAPKintmp = path.join(tmp_dir, "MinecraftBedrockAndroid.apk")
        
        const LocalSave = fs.createWriteStream(SaveAPKintmp);

        drive.files.get({fileId: "11jJjMZRtrQus3Labo_kr85EgtgSVRPLI",alt: "media"}, {responseType: "stream"}, (err, res) => {
            res.data.on("end", () => {
                console.log(`Done, Save in ${SaveAPKintmp}`);
            }).on("error", err => {
                throw new Error(err)
            }).pipe(LocalSave)
        });
    });
}