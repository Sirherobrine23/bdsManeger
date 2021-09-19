const path = require("path");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const NewBdsSettings = require("../../lib/BdsSettings");

// Upload Function
async function Uploadbackups(object = "Backup.zip", fileLocation = "Backup.zip", callback = function (){}) {
    return new Promise(async function(resolve, reject){
        try {
            const { Account, AccountKey, Container } = NewBdsSettings.GetCloudConfig("Azure");
            const sharedKeyCredential = new StorageSharedKeyCredential(Account, AccountKey);
            const blobClient = new BlobServiceClient(`https://${Account}.blob.core.windows.net`, sharedKeyCredential).getContainerClient(Container)
            if (!(blobClient.exists())) await blobClient.create();
            const containerClient = blobClient.getBlockBlobClient(path.resolve(object));
            const Reponse = await containerClient.uploadFile(fileLocation, {
                blockSize: 4 * 1024 * 1024,
                concurrency: 20,
                onProgress: (env) => console.log(env)
            })
            if (typeof callback === "function") callback(Reponse);
            resolve(Reponse);
        } catch (err) {
            console.log(`uploadFile failed, requestId - ${err.details.requestId}, statusCode - ${err.statusCode}, errorCode - ${err.details.errorCode}`);
            reject(err);
        }
    })
}

module.exports = {
    Uploadbackups
}