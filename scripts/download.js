var AdmZip = require("adm-zip");
const { warn, info } = require("console");
const { writeFileSync, existsSync, readFileSync, readdirSync } = require("fs");
const { join, resolve } = require("path");
const bds = require("../index")
const { platform_version_update, valid_platform, PHPbinsUrls } = bds
const { bds_config, bds_dir_bedrock, bds_dir_java, bds_dir_pocketmine, bds_dir_jsprismarine } = require("../lib/bdsgetPaths")
const response = require("../index").SERVER_URLs
const commandExists = require("../lib/commandExist");
const { cloneSync } = require("../lib/git_simples");
const { execSync } = require("child_process");
module.exports = function (version, force_install, callback) {
    if (force_install === true) {
        info("Bds Maneger core force install")
        bds_config.platform_version.java = "latest";
        bds_config.platform_version.bedrock = "latest"
        bds_config.platform_version.pocketmine = "latest"
    }
    if (version === "") version="latest"
    if (version === undefined) version="latest"
    if (version === true) version="latest"
    if (version === "true") version="latest"
    var url;

    // Bedrock Installer Script
    if (bds.platform === "bedrock") {
        if (valid_platform.bedrock === true){
            var server_configs, permissions, whitelist;
            if (version === "latest") version = response.latest.bedrock
            if (existsSync(join(bds_dir_bedrock, "server.properties"))) server_configs = readFileSync(join(bds_dir_bedrock, "server.properties"), "utf8");
            if (existsSync(join(bds_dir_bedrock, "permissions.json"))) permissions = readFileSync(join(bds_dir_bedrock, "permissions.json"), "utf8");
            if (existsSync(join(bds_dir_bedrock, "whitelist.json"))) whitelist = readFileSync(join(bds_dir_bedrock, "whitelist.json"), "utf8");
            url = response.bedrock[version][bds.arch][process.platform]
            if (response.bedrock[version].data) console.log(`Server data publish: ${response.bedrock[version].data}`)
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
                    if (typeof callback === "function") callback(true);
                    return true
                })
            } else {
                warn("Jumping, installed version")
                if (typeof callback === "function") callback(true);
                return true
            }
        } else throw Error("Bedrock Not suported")
    }
    // java Installer Script
    else if (bds.platform === "java") {
        if (valid_platform.java === true){
            if (version === "latest") version = response.java_latest
            if (version !== bds_config.platform_version.java){
                url = response.java[version].url
                console.log(`Server data publish: ${response.java[version].data}`)
                fetch(url).then(response => response.arrayBuffer()).then(response => Buffer.from(response)).then(response => {
                    console.log("Download Sucess")
                    writeFileSync(join(bds_dir_java, "MinecraftServerJava.jar"), response, "binary")
                    console.log("Save sucess");
                    platform_version_update(version)
                    if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
                })
            } else {
                warn("Jumping, installed version")
                if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
            }
        } else throw Error("Java not suported")
    }
    // Pocketmine-MP Installer Script
    else  if (bds.platform === "pocketmine") {
        if (valid_platform.pocketmine === true) {
            if (version === "latest") version = response.PocketMine_latest
            url = response.PocketMine[version].url
            console.log(`Server data publish: ${response.PocketMine[version].data}`);
            fetch(url).then(response => {if (response.ok) return response.arrayBuffer(); else throw new Error(response)}).then(response => Buffer.from(response)).then(response => {
                writeFileSync(join(bds_dir_pocketmine, "PocketMine-MP.phar"), response, "binary")
                console.log("PocketMine-MP.phar saved");
                platform_version_update(version)
                const binFolder = join(bds_dir_pocketmine, "bin")
                if (commandExists("php")) throw new Error("Unistall php from system, or use docker image")
                else if ((!existsSync(binFolder)) || force_install) {
                    var urlPHPBin;
                    try {
                        urlPHPBin = PHPbinsUrls[process.platform][bds.arch];
                    } catch (error) {
                        throw new Error({
                            error: "Not found to platform",
                            platform: process.platform,
                            arch: bds.arch,
                            Others_support: PHPbinsUrls.other
                        })
                    }
                    console.log("Downloading PHP Binaries");
                    fetch(urlPHPBin).then(res => {if (res.ok) return res.arrayBuffer(); else throw new Error(res)}).then(response => Buffer.from(response)).then(php => {
                        const zipExtractBin = new AdmZip(php);
                        // Extract bin
                        zipExtractBin.extractAllTo(bds_dir_pocketmine, true)
                        console.log("Successfully extracting the binaries")
                        // Check Configs and others
                        const phpFolder = resolve(bds_dir_pocketmine, "bin")
                        const phpConfigInit = readFileSync(join(phpFolder, "php7", "bin", "php.ini"), "utf-8").split(/\r\?\n/g);
                        // Check Php bin folder and bins
                        var check_extension_dir = false;
                        for (let index of phpConfigInit) if (index.includes("extension_dir")) check_extension_dir = true;
                        // Post check extension_dir
                        if (check_extension_dir) console.log("Skipping php.ini configuration");
                        else {
                            const phpExtensiosnsDir = resolve(bds_dir_pocketmine, "bin/php7/lib/php/extensions")
                            const phpExtensiosns = readdirSync(phpExtensiosnsDir)
                            var exetensionZen;
                            for (let index of phpExtensiosns) if (index.includes("debug-zts")) exetensionZen = index
                            phpConfigInit.push(`extension_dir="${resolve(phpExtensiosnsDir, exetensionZen)}"`)
                            writeFileSync(join(phpFolder, "php7", "bin", "php.ini"), phpConfigInit.join("\n"))
                        }
                        if (typeof callback === "function") callback(true);
                        return true
                        // End Phph bin
                    })
                } else if (typeof callback === "function") callback(true);
            }).catch( error => {if (typeof callback === "function") callback(false);console.error(JSON.stringify(error))})
        } else throw Error("Pocketmine not suported")
    } else if (bds.platform === "jsprismarine") {
        if (valid_platform.jsprismarine === true) {
            console.log("Cloning the repository");
            cloneSync("https://github.com/JSPrismarine/JSPrismarine.git", bds_dir_jsprismarine, 1);
            for (let command of ["npm install", "npx -y lerna bootstrap", "npm run build"]) console.log(execSync(command, {cwd: bds_dir_jsprismarine}).toString("ascii"));
            if (typeof callback === "function") callback(true);
            return true
        } else throw Error("jsprismarine not suported")
    } else throw Error("Bds maneger Config file error")
}
