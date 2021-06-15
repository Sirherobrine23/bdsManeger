const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const Uploadbackups = async function (
    account = (process.env.ACCOUNT_NAME || ""),
    accountKey = (process.env.ACCOUNT_KEY || ""),
    container = "BdsBackup",
    object = "Backup.zip",
    fileLocation = "Backup.zip"
) {
    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
    const blobClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`, sharedKeyCredential).getContainerClient(container)

    if (!(blobClient.exists())) await blobClient.create();

    const containerClient = blobClient.getBlockBlobClient(object)
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