var AdmZip = require("adm-zip");
const { writeFileSync, existsSync, readFileSync, readdirSync } = require("fs");
const { join, resolve } = require("path");
const bds = require("../index")
const { valid_platform } = require("../lib/BdsSystemInfo");
const { GetServerPaths, GetServerVersion, UpdateServerVersion, GetPlatform } = require("../lib/BdsSettings");
const { GitClone } = require("../lib/git_simples");
const { execSync } = require("child_process");
const fetchSync = require("@the-bds-maneger/fetchsync")
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
        ServerVersion.java = "latest";
        ServerVersion.bedrock = "latest"
        ServerVersion.pocketmine = "latest"
    }
    if (!(version) || version === true || version === "true" || version === "latest") version = Servers.latest[CurrentPlatform]
    var url, response;

    console.log(`Installing version ${version}`);
    // Bedrock Installer Script
    if (CurrentPlatform === "bedrock") {
        if (valid_platform.bedrock === true){
            if (version === "latest") version = Servers.latest.bedrock
            if (ServerVersion.bedrock === version) {
                console.warn("Jumping, installed version")
                if (typeof callback === "function") callback(true);
                return true
            } else {
                if (Servers.bedrock[version].data) console.log(`Server data publish: ${Servers.bedrock[version].data}`)
                url = Servers.bedrock[version][bds.arch][process.platform]
                var server_configs, permissions, whitelist;
                if (existsSync(join(bds_dir_bedrock, "server.properties"))) server_configs = readFileSync(join(bds_dir_bedrock, "server.properties"), "utf8");
                if (existsSync(join(bds_dir_bedrock, "permissions.json"))) permissions = readFileSync(join(bds_dir_bedrock, "permissions.json"), "utf8");
                if (existsSync(join(bds_dir_bedrock, "whitelist.json"))) whitelist = readFileSync(join(bds_dir_bedrock, "whitelist.json"), "utf8");
                fetchSync(url, {
                    Binary: true
                }).Buffer;
                console.log("Download Sucess")
                const zip = new AdmZip(response)
                zip.extractAllTo(bds_dir_bedrock, true)
                console.log("Extract Sucess")
                if (server_configs) writeFileSync(join(bds_dir_bedrock, "server.properties"), server_configs);
                if (permissions) writeFileSync(join(bds_dir_bedrock, "permissions.json"), permissions)
                if (whitelist) writeFileSync(join(bds_dir_bedrock, "whitelist.json"), whitelist)
                UpdateServerVersion(version)
                if (typeof callback === "function") callback(true);
                return true
            }
        } else throw Error("Bedrock Not suported")
    }
    // java Installer Script
    else if (CurrentPlatform === "java") {
        if (valid_platform.java === true){
            if (version === "latest") version = Servers.latest.java
            if (version === ServerVersion.java) {
                console.warn("Jumping, installed version")
                if (typeof callback === "function") callback(true);
                return true
            } else {
                url = Servers.java[version].url
                console.log(`Server data publish: ${Servers.java[version].data}`)
                response = fetchSync(url, {
                    Binary: true
                }).Buffer
                console.log("Download Sucess")
                writeFileSync(join(bds_dir_java, "MinecraftServerJava.jar"), response, "binary")
                console.log("Save sucess");
                UpdateServerVersion(version);
                if (typeof callback === "function") callback(true);
                return true
            }
        } else throw Error("Java is not supported or required software is not installed")
    }
    // Pocketmine-MP Installer Script
    else  if (CurrentPlatform === "pocketmine") {
        if (valid_platform.pocketmine === true) {
            if (version === "latest") version = Servers.latest.pocketmine
            if (version === ServerVersion.pocketmine) {
                console.warn("Jumping, installed version")
                if (typeof callback === "function") callback(true);
                return true
            } else {
                const PocketMineJson = Servers.pocketmine[version]
                console.log(`Server data publish: ${PocketMineJson.data}`);
                response = fetchSync(PocketMineJson.url, {
                    Binary: true
                }).Buffer;
                console.log("Success when downloading php from PocketMine-MP");
                // Write php file
                writeFileSync(join(bds_dir_pocketmine, "PocketMine-MP.phar"), response, "binary")

                // Check PHP binary
                var urlPHPBin; /* Check System php */try {urlPHPBin = PHPBin[process.platform][bds.arch]} catch (error) {throw new Error("unsupported system")}
                console.log("Downloading PHP Binaries");
                // Fetch Files
                const php = fetchSync(urlPHPBin, {
                    Binary: true
                });
                const zipExtractBin = new AdmZip(php);
                // Extract bin
                zipExtractBin.extractAllTo(bds_dir_pocketmine, true)
                console.log("Successfully extracting the binaries")
                // Check Configs and others
                const phpFolder = resolve(bds_dir_pocketmine, "bin")
                const phpConfigInit = readFileSync(join(phpFolder, "php7", "bin", "php.ini"), "utf-8").split(/\n/g).filter(a=>a.trim());
                // Post check extension_dir
                const phpExtensiosnsDir = resolve(bds_dir_pocketmine, "bin/php7/lib/php/extensions");const phpExtensiosns = readdirSync(phpExtensiosnsDir);var exetensionZen;for (let index of phpExtensiosns) if (index.includes("debug-zts")) exetensionZen = index
                // Check Php bin folder and bins
                var check_extension_dir = false;for (let index of phpConfigInit) if (index.includes("extension_dir")) check_extension_dir = true;
                if (check_extension_dir) console.log("Skipping php.ini configuration");
                else {
                    phpConfigInit.push(`extension_dir="${resolve(phpExtensiosnsDir, exetensionZen)}"`);
                    writeFileSync(join(phpFolder, "php7", "bin", "php.ini"), phpConfigInit.join("\n"));
                }
                // Update server Version
                UpdateServerVersion(version)
                // Callback
                if (typeof callback === "function") callback(true);
                return true
            }
        } else throw Error("Pocketmine not suported")
    }

    // JSPrismarine
    else if (CurrentPlatform === "jsprismarine") {
        if (valid_platform.jsprismarine === true) {
            console.log("Downloading the JSPrismarine repository.");
            const commit_sha = GitClone("https://github.com/The-Bds-Maneger/JSPrismarine.git", bds_dir_jsprismarine, 1);
            for (let command of ["npm install", "npx -y lerna bootstrap", "npm run build"]) console.log(execSync(command, {cwd: bds_dir_jsprismarine}).toString("ascii"));
            console.log(commit_sha);
            UpdateServerVersion(commit_sha, "jsprismarine")
            if (typeof callback === "function") callback(true);
            return true
        } else throw Error("jsprismarine not suported")
    }

    // dragonfly
    else if (CurrentPlatform === "dragonfly") {
        throw "Bds maneger Config file error";
    }
    // Unidentified platform
    else throw Error("Bds maneger Config file error")
}
