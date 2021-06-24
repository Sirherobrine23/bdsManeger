const fs = require("fs");
const { google } = require("googleapis");
const { authorize } = require("./Auth/Google");
const { GetCloudConfig } = require("../lib/BdsSettings");

module.exports.Uploadbackups = function (file_name = "Backup.zip", fileLocation = "Backup.zip", BackupCallback){
    const parent_id = GetCloudConfig("Driver").RootID
    return authorize(function (auth) {
        const drive = google.drive({version: "v3", auth});
        const UploadFile = {
            resource: {
                name: file_name
            },
            media: {
                mimeType: "application/octet-stream",
                body: fs.createReadStream(fileLocation)
            },
            fields: "id"
        }
        // Driver Root ID Backups
        if (parent_id) UploadFile.resource.parents = [parent_id];
        
        // Request
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