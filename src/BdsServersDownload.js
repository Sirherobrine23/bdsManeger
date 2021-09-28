const fs = require("fs");
const path = require("path");
const { writeFileSync, existsSync, readFileSync, readdirSync, rmSync } = fs;
const { join, resolve } = path;
var AdmZip = require("adm-zip");
const BdsInfo = require("../lib/BdsSystemInfo");
const { GetServerPaths, GetPlatform } = require("../lib/BdsSettings");
const Extra = require("../BdsManegerInfo.json");
const bds = require("../index");
const Request = require("../lib/Requests");

// Php download and install
async function php_download() {
    const bds_dir_pocketmine = GetServerPaths("pocketmine");
    const PHPBin = (await (await fetch(Extra.Fetchs.php)).json());
    const phpFolder = resolve(bds_dir_pocketmine, "bin");
    const phpExtensiosnsDir = resolve(bds_dir_pocketmine, "bin/php7/lib/php/extensions");
    
    // Check Php Binary
    let urlPHPBin = PHPBin[process.platform]
    if (!(urlPHPBin)) throw new Error("unsupported system")
    urlPHPBin = urlPHPBin[bds.arch];
    if (!(urlPHPBin)) throw new Error("unsupported arch")

    // Remove Old php Binary if it exists
    if (existsSync(phpFolder)) {
        rmSync(phpFolder, { recursive: true });
    }
    const ZipBuffer = Buffer.from((await (await fetch(urlPHPBin)).arrayBuffer()));
    const zipExtractBin = new AdmZip(ZipBuffer);
    zipExtractBin.extractAllTo(bds_dir_pocketmine, false)

    if (process.platform === "win32") return resolve();

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

// New Download Method
async function BdsDownloadV2(version = "latest") {
    const CurrentPlatform = GetPlatform();
    const { valid_platform, require_qemu } = await BdsInfo();
    const LocalServersVersions = bds.BdsSettigs.GetServerVersion();
    const { ServersPaths } = bds.BdsSettigs;

    // Load Version List
    const ServerDownloadJSON = await Request.json(Extra.Fetchs.servers);

    // Check is latest version options or boolean
    if (typeof version === "boolean" || /true|false|null|undefined|latest/.test(`${version}`.toLocaleLowerCase())) version = ServerDownloadJSON.latest[CurrentPlatform];
    if (!version) throw Error("No version found");

    const ReturnObject = {
        version,
        platform: CurrentPlatform,
        url: "",
        data: "",
        skip: false
    }

    // Bedrock
    if (CurrentPlatform === "bedrock") {
        if (valid_platform.bedrock) {
            if (LocalServersVersions.bedrock !== version) {
                // Add info to ReturnObject
                if (require_qemu) ReturnObject.url = ServerDownloadJSON.bedrock[version]["x64"][process.platform]; else ReturnObject.url = ServerDownloadJSON.bedrock[version][bds.arch][process.platform];
                ReturnObject.data = ServerDownloadJSON.bedrock[version].data;

                // Download and Add buffer to AdmZip
                const BedrockZip = new AdmZip(await Request.buffer(ReturnObject.url));

                // Create Backup Bedrock Config
                const BedrockConfigFiles = {
                    proprieties: "",
                    whitelist: "",
                    permissions: "",
                }

                // Get Bedrock Config Files
                if (fs.existsSync(path.join(ServersPaths.bedrock, "bedrock_server.properties"))) BedrockConfigFiles.proprieties = fs.readFileSync(path.join(ServersPaths.bedrock, "bedrock_server.properties"), "utf8");
                if (fs.existsSync(path.join(ServersPaths.bedrock, "whitelist.json"))) BedrockConfigFiles.whitelist = fs.readFileSync(path.join(ServersPaths.bedrock, "whitelist.json"), "utf8");
                if (fs.existsSync(path.join(ServersPaths.bedrock, "permissions.json"))) BedrockConfigFiles.permissions = fs.readFileSync(path.join(ServersPaths.bedrock, "permissions.json"), "utf8");

                // Extract to Bedrock Dir
                BedrockZip.extractAllTo(ServersPaths.bedrock, true);

                // Write Bedrock Config Files
                if (BedrockConfigFiles.proprieties) fs.writeFileSync(path.join(ServersPaths.bedrock, "bedrock_server.properties"), BedrockConfigFiles.proprieties, "utf8");
                if (BedrockConfigFiles.whitelist) fs.writeFileSync(path.join(ServersPaths.bedrock, "whitelist.json"), BedrockConfigFiles.whitelist, "utf8");
                if (BedrockConfigFiles.permissions) fs.writeFileSync(path.join(ServersPaths.bedrock, "permissions.json"), BedrockConfigFiles.permissions, "utf8");

                // Update Server Version
                bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
            } else {
                ReturnObject.skip = true;
            }
        } else {
            throw Error("Bedrock not suported");
        }
    }

    // Java
    else if (CurrentPlatform === "java") {
        if (valid_platform.java) {
            if (LocalServersVersions.java !== version) {
                // Add info to ReturnObject
                ReturnObject.url = ServerDownloadJSON.java[version].url;
                ReturnObject.data = ServerDownloadJSON.java[version].data;

                // Download and write java file
                const JavaBufferJar = await Request.buffer(ReturnObject.url);
                fs.writeFileSync(path.join(ServersPaths.java, "MinecraftServerJava.jar"), JavaBufferJar, "binary");

                // Write EULA
                fs.writeFileSync(path.join(ServersPaths.java, "eula.txt"), "eula=true");

                // Update Server Version
                bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
            } else {
                ReturnObject.skip = true;
            }
        } else {
            throw Error("Java not suported");
        }
    }

    // Spigot
    else if (CurrentPlatform === "spigot") {
        if (valid_platform.spigot) {
            if (LocalServersVersions.spigot !== version) {
                // Add info to ReturnObject
                const FindedSpigot = ServerDownloadJSON.spigot.find(spigot => spigot.version === version);
                ReturnObject.url = FindedSpigot.url;
                ReturnObject.data = FindedSpigot.data;

                // Download and write java file
                fs.writeFileSync(path.join(ServersPaths.spigot, "spigot.jar"), await Request.buffer(ReturnObject.url), "binary");

                // Update Server Version
                bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
            } else {
                ReturnObject.skip = true;
            }
        } else {
            throw Error("Spigot not suported");
        }
    }

    // Dragonfly
    else if (CurrentPlatform === "dragonfly") {
        if (valid_platform.dragonfly) {
            if (LocalServersVersions.dragonfly !== version) {
                // Add info to ReturnObject
                ReturnObject.url = ServerDownloadJSON.dragonfly[version][process.platform][bds.arch]
                ReturnObject.data = ServerDownloadJSON.dragonfly[version].data;

                // Download
                let DgBin = path.join(ServersPaths.dragonfly, "Dragonfly");
                if (process.platform === "win32") DgBin += ".exe";
                fs.writeFileSync(DgBin, await Request.buffer(ReturnObject.url), "binary");

                // Update Server Version
                bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
            } else {
                ReturnObject.skip = true;
            }
        } else {
            throw Error("Dragonfly not suported");
        }
    }

    // Pocketmine-MP
    else if (CurrentPlatform === "pocketmine") {
        if (valid_platform.pocketmine) {
            if (LocalServersVersions.pocketmine !== version) {
                // Add info to ReturnObject
                ReturnObject.url = ServerDownloadJSON.pocketmine[version].url;
                ReturnObject.data = ServerDownloadJSON.pocketmine[version].data;

                // Download PHP Bin
                await php_download();

                // Download php file and save
                const PocketmineBufferPhp = await Request.buffer(ReturnObject.url);
                fs.writeFileSync(path.join(ServersPaths.pocketmine, "PocketMine-MP.phar"), PocketmineBufferPhp, "binary");

                // Update Server Version
                bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
            } else {
                ReturnObject.skip = true;
            }
        } else {
            throw Error("Pocketmine-MP not suported");
        }
    }

    // if the platform does not exist
    else throw Error("No Valid Platform");

    // Return info download
    return ReturnObject;
}

// Export
module.exports = BdsDownloadV2;
module.exports.v2 = BdsDownloadV2;
