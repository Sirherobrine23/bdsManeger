var AdmZip = require("adm-zip");
const { warn, info } = require("console");
const { writeFileSync, existsSync, readFileSync, readdirSync } = require("fs");
const { join, resolve } = require("path");
const bds = require("../index")
const { valid_platform } = require("../lib/BdsSystemInfo");
const { GetServerPaths, GetServerVersion, UpdateServerVersion, GetPlatform } = require("../lib/BdsSettings");
const commandExists = require("../lib/commandExist");
const { cloneSync } = require("../lib/git_simples");
const { execSync } = require("child_process");
const fetchSync = require("../lib/fetchSync")
const Extra = require("../extra.json");

const 
    bds_dir_bedrock = GetServerPaths("bedrock"),
    bds_dir_java = GetServerPaths("java"),
    bds_dir_pocketmine = GetServerPaths("pocketmine"),
    bds_dir_jsprismarine = GetServerPaths("jsprismarine");

module.exports = function (version, force_install, callback) {
    const Servers = fetchSync(Extra.download.servers).json(), PHPBin = fetchSync(Extra.download.php).json()
    const ServerVersion = GetServerVersion()
    const CurrentPlatform = GetPlatform()
    if (force_install === true) {
        info("Bds Maneger core force install")
        ServerVersion.java = "latest";
        ServerVersion.bedrock = "latest"
        ServerVersion.pocketmine = "latest"
    }
    if (!(version) || version === true || version === "true" || version === "latest") version = Servers.latest[CurrentPlatform]
    var url;

    // Bedrock Installer Script
    if (CurrentPlatform === "bedrock") {
        if (valid_platform.bedrock === true){
            if (version === "latest") version = Servers.latest.bedrock
            if (ServerVersion.bedrock === version) {
                warn("Jumping, installed version")
                if (typeof callback === "function") callback(true);
                return true
            } else {
                if (Servers.bedrock[version].data) console.log(`Server data publish: ${Servers.bedrock[version].data}`)
                url = Servers.bedrock[version][bds.arch][process.platform]
                var server_configs, permissions, whitelist;
                if (existsSync(join(bds_dir_bedrock, "server.properties"))) server_configs = readFileSync(join(bds_dir_bedrock, "server.properties"), "utf8");
                if (existsSync(join(bds_dir_bedrock, "permissions.json"))) permissions = readFileSync(join(bds_dir_bedrock, "permissions.json"), "utf8");
                if (existsSync(join(bds_dir_bedrock, "whitelist.json"))) whitelist = readFileSync(join(bds_dir_bedrock, "whitelist.json"), "utf8");
                fetch(url).then(res => {if (res.ok) return res.arrayBuffer(); else throw res}).then(res => Buffer.from(res)).then(response => {
                    console.log("Download Sucess")
                    const zip = new AdmZip(response)
                    zip.extractAllTo(bds_dir_bedrock, true)
                    console.log("Extract Sucess")
                    if (server_configs) writeFileSync(join(bds_dir_bedrock, "server.properties"), server_configs);
                    if (permissions) writeFileSync(join(bds_dir_bedrock, "permissions.json"), permissions)
                    if (whitelist) writeFileSync(join(bds_dir_bedrock, "whitelist.json"), whitelist)
                    UpdateServerVersion(version)
                    if (typeof callback === "function") callback(true);
                })
            }
        } else throw Error("Bedrock Not suported")
    }
    // java Installer Script
    else if (CurrentPlatform === "java") {
        if (valid_platform.java === true){
            if (version === "latest") version = Servers.latest.java
            if (version === ServerVersion.java) {
                warn("Jumping, installed version")
                if (typeof callback === "function") callback(true);
                return true
            } else {
                url = Servers.java[version].url
                console.log(`Server data publish: ${Servers.java[version].data}`)
                fetch(url).then(res => {if (res.ok) return res.arrayBuffer(); else throw res}).then(res => Buffer.from(res)).then(response => {
                    console.log("Download Sucess")
                    writeFileSync(join(bds_dir_java, "MinecraftServerJava.jar"), response, "binary")
                    console.log("Save sucess");
                    UpdateServerVersion(version);
                    if (typeof callback === "function") callback(true);
                    return true
                })
            }
        } else throw Error("Java is not supported or required software is not installed")
    }
    // Pocketmine-MP Installer Script
    else  if (CurrentPlatform === "pocketmine") {
        if (valid_platform.pocketmine === true) {
            if (version === "latest") version = Servers.PocketMine_latest
            if (version === ServerVersion.pocketmine) {
                warn("Jumping, installed version")
                if (typeof callback === "function") callback(true);
                return true
            } else {
                const PocketMineJson = Servers.PocketMine[version]
                console.log(`Server data publish: ${PocketMineJson.data}`);
                fetch(PocketMineJson.url).then(res => {if (res.ok) return res.arrayBuffer(); else throw res}).then(res => Buffer.from(res)).then(response => {
                    console.log("Success when downloading php from PocketMine-MP");
                    // Write php file
                    writeFileSync(join(bds_dir_pocketmine, "PocketMine-MP.phar"), response, "binary")
                    
                    // Update server Version
                    UpdateServerVersion(version)

                    // Check PHP binary
                    const phpBinFolder = join(bds_dir_pocketmine, "bin")
                    if (commandExists("php")) throw new Error("Unistall php from system, or use docker image")
                    else if ((!existsSync(phpBinFolder)) || force_install) {
                        var urlPHPBin;
                        try {urlPHPBin = PHPBin[process.platform][bds.arch];}
                        catch (error) {
                            throw new Error("")
                        }
                        console.log("Downloading PHP Binaries");
                        fetch(urlPHPBin).then(res => {if (res.ok) return res.arrayBuffer(); else throw res}).then(res => Buffer.from(res)).then(php => {
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
                    }
                    
                    // Callback
                    if (typeof callback === "function") callback(true);
                })
            }
        } else throw Error("Pocketmine not suported")
    } else if (CurrentPlatform === "jsprismarine") {
        if (valid_platform.jsprismarine === true) {
            console.log("Cloning the repository");
            cloneSync("https://github.com/JSPrismarine/JSPrismarine.git", bds_dir_jsprismarine, 1);
            for (let command of ["npm install", "npx -y lerna bootstrap", "npm run build"]) console.log(execSync(command, {cwd: bds_dir_jsprismarine}).toString("ascii"));
            if (typeof callback === "function") callback(true);
            return true
        } else throw Error("jsprismarine not suported")
    } else throw Error("Bds maneger Config file error")
}
