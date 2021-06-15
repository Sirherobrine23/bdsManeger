const os = require("oci-objectstorage");
const common = require("oci-common");
const fs = require("fs");
const { resolve } = require("path");

const Uploadbackups = async function (
    bucket = "MinecraftAPKStorageBySirherobrine23",
    object = "Backup.zip",
    fileLocation = resolve(__dirname, "../Backup.zip"),
    callback = function (data){console.log(data)}
){
    const provider = new common.ConfigFileAuthenticationDetailsProvider();
    const client = new os.ObjectStorageClient({
        authenticationDetailsProvider: provider
    });

    try {
        const request = {};
        const response = await client.getNamespace(request);
        const namespace = response.value;
        const stats = fs.statSync(fileLocation);
        const nodeFsBlob = new os.NodeFSBlob(fileLocation, stats.size);
        const objectData = await nodeFsBlob.getData();
        const putObjectRequest = {
            namespaceName: namespace,
            bucketName: bucket,
            putObjectBody: objectData,
            objectName: object,
            contentLength: stats.size
        };
        const putObjectResponse = await client.putObject(putObjectRequest);
        console.log("File upload successful");
        return callback(putObjectResponse)
    } catch (error) {
        console.log("Error ", error);
    }
}

module.exports = {
    Uploadbackups,
}