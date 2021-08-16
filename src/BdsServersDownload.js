const { writeFileSync, existsSync, readFileSync, readdirSync, rmSync } = require("fs");
const { join, resolve, basename } = require("path");
var AdmZip = require("adm-zip");
const { valid_platform } = require("../lib/BdsSystemInfo");
const { GetServerPaths, GetServerVersion, UpdateServerVersion, GetPlatform } = require("../lib/BdsSettings");
const Extra = require("../BdsManegerInfo.json");
const bds = require("../index");
const { execSync } = require("child_process");

module.exports = async function (version, force_install, callback) {
    return new Promise(async (promise_resolve, promise_reject) => {
        try {
            // Server Paths
            const bds_dir_bedrock = GetServerPaths("bedrock"),
            bds_dir_java = GetServerPaths("java"),
            bds_dir_pocketmine = GetServerPaths("pocketmine"),
            bds_dir_spigot = GetServerPaths("spigot"),
            bds_dir_dragonfly = GetServerPaths("dragonfly");

            // JSON Configs and others
            const Servers = (await (await fetch(Extra.download.servers)).json());
            const ServerVersion = GetServerVersion();
            const CurrentPlatform = GetPlatform();
            if (force_install === true) { 
                ServerVersion.java = "latest";
                ServerVersion.bedrock = "latest"
                ServerVersion.pocketmine = "latest"
            }
            if (!(version) || version === true || version === "true" || version === "latest") version = Servers.latest[CurrentPlatform]
            var url;

            console.log(`Installing version ${version}`);
            // Bedrock Installer Script
            if (CurrentPlatform === "bedrock") {
                if (valid_platform.bedrock === true){
                    if (version === "latest") version = Servers.latest.bedrock
                    if (!(force_install === true) && ServerVersion.bedrock === version) {
                        console.warn("Jumping, installed version")
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true);
                    } else {
                        if (Servers.bedrock[version].data) console.log(`Server data publish: ${Servers.bedrock[version].data}`)
                        url = Servers.bedrock[version][bds.arch][process.platform]
                        var server_configs, permissions, whitelist;
                        if (existsSync(join(bds_dir_bedrock, "server.properties"))) server_configs = readFileSync(join(bds_dir_bedrock, "server.properties"), "utf8");
                        if (existsSync(join(bds_dir_bedrock, "permissions.json"))) permissions = readFileSync(join(bds_dir_bedrock, "permissions.json"), "utf8");
                        if (existsSync(join(bds_dir_bedrock, "whitelist.json"))) whitelist = readFileSync(join(bds_dir_bedrock, "whitelist.json"), "utf8");
                        
                        // Download and Add to Adm_Zip
                        const zip = new AdmZip(Buffer.from((await (await fetch(url)).arrayBuffer())))
                        console.log("Download Sucess")

                        zip.extractAllTo(bds_dir_bedrock, true)
                        console.log("Extract Sucess")
                        if (server_configs) writeFileSync(join(bds_dir_bedrock, "server.properties"), server_configs);
                        if (permissions) writeFileSync(join(bds_dir_bedrock, "permissions.json"), permissions)
                        if (whitelist) writeFileSync(join(bds_dir_bedrock, "whitelist.json"), whitelist)
                        UpdateServerVersion(version);
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true);
                    }
                } else throw Error("Bedrock Not suported")
            }

            // Java
            else if (CurrentPlatform === "java") {
                if (valid_platform.java === true){
                    if (version === "latest") version = Servers.latest.java
                    if (!(force_install === true) && version === ServerVersion.java) {
                        console.warn("Jumping, installed version")
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true)
                    } else {
                        url = Servers.java[version].url
                        console.log(`Server data publish: ${Servers.java[version].data}`)
                        
                        writeFileSync(join(bds_dir_java, "MinecraftServerJava.jar"), Buffer.from((await (await fetch(url)).arrayBuffer())), "binary")
                        console.log("Success when downloading and saving Minecraft Server java");
                        UpdateServerVersion(version);
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true);
                    }
                } else throw Error("Java is not supported or required software is not installed")
            }

            // Pocketmine-MP
            else  if (CurrentPlatform === "pocketmine") {
                if (valid_platform.pocketmine === true) {
                    if (version === "latest") version = Servers.latest.pocketmine
                    if (!(force_install === true) && version === ServerVersion.pocketmine) {
                        console.warn("Jumping, installed version")
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true)
                    } else {
                        const PocketMineJson = Servers.pocketmine[version]
                        console.log(`Server data publish: ${PocketMineJson.data}`);
                        
                        writeFileSync(join(bds_dir_pocketmine, "PocketMine-MP.phar"), Buffer.from((await (await fetch(PocketMineJson.url)).arrayBuffer())), "binary")
                        console.log("Success downloading and saving PocketMine-MP php");

                        await php_download();

                        // Update server Version
                        UpdateServerVersion(version)
                        // Callback
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true);
                    }
                } else throw Error("Pocketmine not suported")
            }

            // Spigot
            else if (CurrentPlatform === "spigot") {
                if (valid_platform.java) {
                    if (version === "latest") version = Servers.latest.spigot;
                    if (!(force_install === true) && version === ServerVersion.spigot) {
                        console.warn("Jumping, installed version")
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true)
                    } else {
                        const SpigotURL = Servers.spigot[version].url;
                        if (Servers.spigot[version].data) console.log(`Server data publish: ${Servers.spigot[version].data}`);
                        writeFileSync(join(bds_dir_spigot, "spigot.jar"), Buffer.from((await (await fetch(SpigotURL)).arrayBuffer())), "binary");
                        console.log("Success when downloading and saving Spigot");
                        UpdateServerVersion(version);
                        if (typeof callback === "function") await callback(undefined, true);
                        promise_resolve(true);
                    }
                } else throw Error("Java is not supported or required software is not installed")
            }

            // dragonfly
            else if (CurrentPlatform === "dragonfly") {
                if (valid_platform.dragonfly) {
                    console.info("Dragonfly does not support versions");
                    execSync("git clone https://github.com/df-mc/dragonfly ./", {
                        cwd: bds_dir_dragonfly
                    });
                    if (typeof callback === "function") await callback(undefined, true);
                    promise_resolve(true);
                } else throw Error("Dragonfly not suported")
            }

            // Unidentified platform
            else throw Error("Bds maneger Config file error")
        } catch (err) {
            if (typeof callback === "function") await callback(err, false);
            return promise_reject(err);
        }
    });
}

async function php_download() {
    const bds_dir_pocketmine = GetServerPaths("pocketmine");
    const PHPBin = (await (await fetch(Extra.download.php)).json());
    const phpFolder = resolve(bds_dir_pocketmine, "bin");
    const phpExtensiosnsDir = resolve(bds_dir_pocketmine, "bin/php7/lib/php/extensions");
    
    // Check Php Binary
    let urlPHPBin = PHPBin[process.platform]
    if (!(urlPHPBin)) throw new Error("unsupported system")
    urlPHPBin = urlPHPBin[bds.arch]

    // Remove Old php Binary if it exists
    if (existsSync(phpFolder)) {
        console.log("Removing old PHP files.");
        rmSync(phpFolder, { recursive: true });
    }    
    console.log(`Downloading ${urlPHPBin}`);
    const ZipBuffer = Buffer.from((await (await fetch(urlPHPBin)).arrayBuffer()));
    console.log(`${basename(urlPHPBin)} downloaded`);
    
    console.log(`Extracting ${basename(urlPHPBin)}`);
    const zipExtractBin = new AdmZip(ZipBuffer);
    zipExtractBin.extractAllTo(bds_dir_pocketmine, false)
    console.log("Successfully extracting the binaries")

    let phpConfigInit = readFileSync(join(phpFolder, "php7", "bin", "php.ini"), "utf8");
    if (!(existsSync(phpExtensiosnsDir))) return true;

    const phpExtensiosns = readdirSync(phpExtensiosnsDir).map(FileFolder => {
        if (!(FileFolder.includes("debug-zts"))) return false;
        return resolve(phpExtensiosnsDir, FileFolder);
    }).filter(a=>a);

    if (phpConfigInit.includes("extension_dir")) console.log("Skipping php.ini configuration");
    else {
        phpConfigInit = (`extension_dir="${phpExtensiosns.join()}"\n${phpConfigInit}`);
        writeFileSync(join(phpFolder, "php7", "bin", "php.ini"), phpConfigInit);
    }
    return true;
}