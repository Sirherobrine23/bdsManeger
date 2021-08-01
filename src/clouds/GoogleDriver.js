const fs = require("fs");
const { google } = require("googleapis");
const { authorize } = require("./Auth/Google");
const { GetCloudConfig } = require("../../lib/BdsSettings");

module.exports.Uploadbackups = async function (file_name = "Backup.zip", fileLocation = "Backup.zip", BackupCallback){
    return new Promise(async function (resolve, reject){
        const parent_id = GetCloudConfig("Driver").RootID
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
        
        const auth = await authorize();
        const drive = google.drive({version: "v3", auth});
        drive.files.create(UploadFile, (err, file) => {
            if (err) reject(err)
            else {
                console.log(`File URL: https://drive.google.com/file/d/${file.data.id}/`);
                if (typeof BackupCallback === "function") BackupCallback(file);
                resolve(`https://drive.google.com/file/d/${file.data.id}/`);
            }
        });
        
    });
};