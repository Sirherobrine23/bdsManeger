const oci_storage = require("oci-objectstorage");
const oci_common = require("oci-common");
const fs = require("fs");
const { resolve } = require("path");
const { CloudConfig } = require("../../lib/BdsSettings");

async function Uploadbackups(object = "Backup.zip", fileLocation = resolve(__dirname, "../Backup.zip"), callback = function (data){console.log(data)}){
    return new Promise(async function (resolve, reject){
        try {
            const bucket = CloudConfig.Oracle().Bucket;
            const provider = new oci_common.ConfigFileAuthenticationDetailsProvider();
            const client = new oci_storage.ObjectStorageClient({
                authenticationDetailsProvider: provider
            });
            const request = {};
            const response = await client.getNamespace(request);
            const namespace = response.value;
            const stats = fs.statSync(fileLocation);
            const nodeFsBlob = new oci_storage.NodeFSBlob(fileLocation, stats.size);
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
            if (typeof callback === "function") return callback(putObjectResponse);
            resolve(putObjectResponse);
        } catch (error) {
            console.log("Error ", error);
            reject(error);
        }
    });
}

module.exports = {
    Uploadbackups,
}