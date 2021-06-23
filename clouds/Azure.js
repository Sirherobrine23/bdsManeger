const { resolve } = require("path");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const NewBdsSettings = require("../lib/BdsSettings");
const Uploadbackups = async function (object = "Backup.zip", fileLocation = "Backup.zip") {
    const { Account, AccountKey, Container } = NewBdsSettings.GetCloudConfig("Azure");
    const sharedKeyCredential = new StorageSharedKeyCredential(Account, AccountKey);
    const blobClient = new BlobServiceClient(`https://${Account}.blob.core.windows.net`, sharedKeyCredential).getContainerClient(Container)
    if (!(blobClient.exists())) await blobClient.create();
    const containerClient = blobClient.getBlockBlobClient(resolve(object))
    try {
        await containerClient.uploadFile(fileLocation, {
            blockSize: 4 * 1024 * 1024,
            concurrency: 20,
            onProgress: (env) => console.log(env)
        })
        console.log("Upload Sucess")
    } catch (err) {
        console.log(`uploadFile failed, requestId - ${err.details.requestId}, statusCode - ${err.statusCode}, errorCode - ${err.details.errorCode}`);
    }
}

module.exports = {
    Uploadbackups
}