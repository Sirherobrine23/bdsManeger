var AdmZip = require("adm-zip");
const { warn } = require("console");
const {writeFileSync, existsSync, readFileSync} = require("fs");
const { join } = require("path");
const {bds_config, bds_dir_bedrock, bds_dir_java, platform_version_update} = require("../index")
module.exports = function (version, force_install) {
    return fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json").then(response => response.json()).then(response => {
        if (version === "") version="latest"
        if (version === undefined) version="latest"
        const server_platform = bds_config.bds_platform
        var url;
        var server_configs, permissions, whitelist
        if (force_install === undefined) null
        else if (force_install === false) null
        else if (force_install === "") null
        else if (force_install === true) {
            bds_config.platform_version.java = "latest"
            bds_config.platform_version.bedrock = "latest"
        }
        else null
        if (server_platform === "bedrock"){
            if (version === "latest") version = response.bedrock_latest
            if (existsSync(join(bds_dir_bedrock, "server.properties"))) server_configs = readFileSync(join(bds_dir_bedrock, "server.properties"), "utf8");
            if (existsSync(join(bds_dir_bedrock, "permissions.json"))) permissions = readFileSync(join(bds_dir_bedrock, "permissions.json"), "utf8")
            if (existsSync(join(bds_dir_bedrock, "whitelist.json"))) whitelist = readFileSync(join(bds_dir_bedrock, "whitelist.json"), "utf8")
            if (process.platform === "linux") url = response.bedrock[version].url_linux
            else if (process.platform === "win32") url = response.bedrock[version].url_windows
            //else if (process.platform === "darwin") url = response.bedrock[version].url_linux
            console.log(`Server data publish: ${response.bedrock[version].data}`)
            if (bds_config.platform_version.bedrock !== version) {
                fetch(url).then(response => response.arrayBuffer()).then(response => Buffer.from(response)).then(response => {
                    console.log("Download Sucess")
                    const zip_buffer = response
                    var zip = new AdmZip(zip_buffer);
                    zip.extractAllTo(bds_dir_bedrock, true)
                    console.log("Extract Sucess")
                    if (server_configs) writeFileSync(join(bds_dir_bedrock, "server.properties"), server_configs);
                    if (permissions) writeFileSync(join(bds_dir_bedrock, "permissions.json"), permissions)
                    if (whitelist) writeFileSync(join(bds_dir_bedrock, "whitelist.json"), whitelist)
                    platform_version_update(version)
                    if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
                })
            } else {
                warn("Jumping, installed version")
                if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
            }
        } else {
            if (version === "latest") version = response.java_latest
            if (version !== bds_config.platform_version.java){
                url = response.java[version].url
                console.log(`Server data publish: ${response.java[version].data}`)
                fetch(url).then(response => response.arrayBuffer()).then(response => Buffer.from(response)).then(response => {
                    console.log("Download Sucess")
                    writeFileSync(join(bds_dir_java, "server.jar"), response, "binary")
                    console.log("Save sucess");
                    platform_version_update(version)
                    if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
                })
            } else {
                warn("Jumping, installed version")
                if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
            }
        }
    })
}
