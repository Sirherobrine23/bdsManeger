const fs = require("fs");
const path = require("path");
const { writeFileSync, existsSync, readFileSync, readdirSync, rmSync } = fs;
const { join, resolve } = path;
var AdmZip = require("adm-zip");
const BdsInfo = require("../lib/BdsSystemInfo");
const { GetServerPaths, GetServerVersion, UpdateServerVersion, GetPlatform } = require("../lib/BdsSettings");
const Extra = require("../BdsManegerInfo.json");
const bds = require("../index");
const { execSync } = require("child_process");
const Request = require("../lib/Requests");

module.exports = function (version = true, force_install = false, callback = (err) => {if (err) console.log("Download Error")}) {
    return new Promise(async (promise_resolve, promise_reject) => {
        BdsInfo().then(info => info.valid_platform).then(valid_platform => {
            Request.JSON(Extra.Fetchs.servers).then(Servers => {
                try {
                    // Server Paths
                    const bds_dir_bedrock = GetServerPaths("bedrock"),
                    bds_dir_java = GetServerPaths("java"),
                    bds_dir_pocketmine = GetServerPaths("pocketmine"),
                    bds_dir_spigot = GetServerPaths("spigot"),
                    bds_dir_dragonfly = GetServerPaths("dragonfly");

                    // JSON Configs and others
                    const ServerVersion = GetServerVersion();
                    const CurrentPlatform = GetPlatform();
                    if (typeof version === "boolean" || /true|latest/gi.test(`${version}`.toLocaleLowerCase())) version = Servers.latest[CurrentPlatform];

                    // Donwload
                    console.log(`Installing version ${version}`);
                    // Bedrock Installer Script
                    if (CurrentPlatform === "bedrock") {
                        if (valid_platform.bedrock === true){
                            
                            if (!(force_install === true) && ServerVersion.bedrock === version) {
                                console.warn("Jumping, installed version")
                                if (typeof callback === "function") callback(undefined, true);
                                promise_resolve(true);
                            } else {
                                // Get Server Version
                                const BedrockUrlDownload = (Servers.bedrock[version][bds.arch] || Servers.bedrock[version]["x64"])[process.platform];
                                if (!(BedrockUrlDownload)) return promise_reject(new Error("Error in find url version"));
                                if (Servers.bedrock[version].data) console.log(`Server data publish: ${Servers.bedrock[version].data}`);

                                // Copy Config files
                                var server_configs, permissions, whitelist;
                                if (existsSync(join(bds_dir_bedrock, "server.properties"))) server_configs = readFileSync(join(bds_dir_bedrock, "server.properties"), "utf8");
                                if (existsSync(join(bds_dir_bedrock, "permissions.json"))) permissions = readFileSync(join(bds_dir_bedrock, "permissions.json"), "utf8");
                                if (existsSync(join(bds_dir_bedrock, "whitelist.json"))) whitelist = readFileSync(join(bds_dir_bedrock, "whitelist.json"), "utf8");
                                
                                // Download and Add to Adm_Zip
                                Request.BUFFER(BedrockUrlDownload).then(ResBuffer => {
                                    // Extract Zip
                                    const zip = new AdmZip(ResBuffer);
                                    console.log("Download Sucess")
                                    zip.extractAllTo(bds_dir_bedrock, true)
                                    console.log("Extract Sucess")
                                    
                                    // Reeplace Server Configs
                                    if (server_configs) writeFileSync(join(bds_dir_bedrock, "server.properties"), server_configs);
                                    if (permissions) writeFileSync(join(bds_dir_bedrock, "permissions.json"), permissions);
                                    if (whitelist) writeFileSync(join(bds_dir_bedrock, "whitelist.json"), whitelist);
                                    
                                    // Update Server Version
                                    UpdateServerVersion(version);

                                    // Resolve
                                    promise_resolve();
                                    if (typeof callback === "function") callback(undefined);
                                }).catch(error => {promise_reject(error); if (typeof callback === "function") callback(error);});
                            }
                        } else {
                            const BedrcokError = Error("Bedrock Not suported");
                            promise_reject(BedrcokError);
                            if (typeof callback === "function") callback(BedrcokError);
                        }
                    }

                    // Java
                    else if (CurrentPlatform === "java") {
                        if (valid_platform.java === true){
                            if (version === "latest") version = Servers.latest.java
                            if (!(force_install === true) && version === ServerVersion.java) {
                                console.warn("Jumping, installed version")
                                promise_resolve(true);
                                if (typeof callback === "function") callback(undefined, true);
                            } else {
                                const JavaDownloadUrl = Servers.java[version].url
                                console.log(`Server data publish: ${Servers.java[version].data}`)
                                Request.BUFFER(JavaDownloadUrl).then(ResBuffer => {
                                    // Save Jar file
                                    writeFileSync(join(bds_dir_java, "MinecraftServerJava.jar"), ResBuffer, "binary")
                                    console.log("Success when downloading and saving Minecraft Server java");
                                    
                                    // Update Server Version
                                    UpdateServerVersion(version);
                                    
                                    // Resolve
                                    promise_resolve();
                                    if (typeof callback === "function") callback(undefined);
                                }).catch(error => {
                                    promise_reject(error);
                                    if (typeof callback === "function") callback(error);
                                });
                            }
                        } else {
                            const JavaError = Error("Java is not supported or required software is not installed");
                            promise_reject(JavaError);
                            if (typeof callback === "function") callback(JavaError);
                        }
                    }

                    // Pocketmine-MP
                    else  if (CurrentPlatform === "pocketmine") {
                        if (valid_platform.pocketmine === true) {
                            if (version === "latest") version = Servers.latest.pocketmine
                            if (!(force_install === true) && version === ServerVersion.pocketmine) {
                                console.warn("Jumping, installed version")
                                promise_resolve();
                                if (typeof callback === "function") callback(undefined);
                            } else {
                                const PocketMineJson = Servers.pocketmine[version]
                                console.log(`Server data publish: ${PocketMineJson.data}`);
                                
                                Request.BUFFER(PocketMineJson.url).then(ResBuffer => {
                                    writeFileSync(join(bds_dir_pocketmine, "PocketMine-MP.phar"), ResBuffer, "binary")
                                    console.log("Success downloading and saving PocketMine-MP php");
                                    php_download().then(() => {
                                        // Update server Version
                                        UpdateServerVersion(version)
                                        // Callback
                                        promise_resolve(true);
                                        if (typeof callback === "function") callback(undefined, true);
                                    }).catch(error => {
                                        promise_reject(error);
                                        if (typeof callback === "function") callback(error);
                                    });
                                }).catch(error => {
                                    promise_reject(error);
                                    if (typeof callback === "function") callback(error);
                                });
                            }
                        } else {
                            const PocketMineError = Error("Pocketmine not suported");
                            promise_reject(PocketMineError);
                            if (typeof callback === "function") callback(PocketMineError);
                        }
                    }

                    // Spigot
                    else if (CurrentPlatform === "spigot") {
                        if (valid_platform.java) {
                            if (version === "latest") version = Servers.latest.spigot;
                            if (!(force_install === true) && version === ServerVersion.spigot) {
                                console.warn("Jumping, installed version")
                                if (typeof callback === "function") callback(undefined, true);
                                promise_resolve(true)
                            } else {
                                const SpigotArray = Servers.spigot[version];
                                if (SpigotArray.data) console.log(`Server data publish: ${SpigotArray.data}`);
                                Request.BUFFER(SpigotArray.url).then(ResBuffer => {
                                    writeFileSync(join(bds_dir_spigot, "spigot.jar"), ResBuffer, "binary");
                                    console.log("Success when downloading and saving Spigot");
                                    UpdateServerVersion(version);
                                    promise_resolve();
                                    if (typeof callback === "function") callback(undefined);
                                });
                            }
                        } else {
                            const JavaError = Error("Java is not supported or required software is not installed");
                            promise_reject(JavaError);
                            if (typeof callback === "function") callback(JavaError);
                        }
                    }

                    // dragonfly
                    else if (CurrentPlatform === "dragonfly") {
                        if (valid_platform.dragonfly) {
                            console.info("Dragonfly does not support versions");
                            execSync("git clone https://github.com/df-mc/dragonfly ./", {
                                cwd: bds_dir_dragonfly
                            });
                            promise_resolve(true);
                            if (typeof callback === "function") callback(undefined);
                        } else {
                            const DragonFlyError = Error("Dragonfly not suported");
                            promise_reject(DragonFlyError);
                            if (typeof callback === "function") callback(DragonFlyError);
                        }
                    }

                    // Unidentified platform
                    else {
                        const Err = Error("Bds maneger Config file error");
                        promise_reject(Err);
                        if (typeof callback === "function") callback(Err);
                    }
                } catch (err) {
                    promise_reject(err);
                    if (typeof callback === "function") callback(err);
                }
            }).catch(err => {
                promise_reject(err);
                if (typeof callback === "function") callback(err);
            });
        }).catch(err => {
            promise_reject(err);
            if (typeof callback === "function") callback(err);
        });
    });
}

// New Download Method
module.exports.v2 = async (version = true) => {
    const CurrentPlatform = GetPlatform();
    const valid_platform = (await BdsInfo()).valid_platform;
    const LocalServersVersions = bds.BdsSettigs.GetServerVersion();
    const { ServersPaths } = bds.BdsSettigs;

    // Load Version List
    const ServerDownloadJSON = await Request.json(Extra.Fetchs.servers);

    // Check is latest version options or boolean
    if (typeof version === "boolean" || /true|false|latest/.test(`${version}`.toLocaleLowerCase())) version = ServerDownloadJSON.latest[CurrentPlatform];
    if (!version) throw Error("No version found");

    const ReturnObject = {
        version: version,
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
                ReturnObject.url = ServerDownloadJSON.bedrock[version][bds.arch][process.platform];
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
                const FindedSpigot = ServerDownloadJSON.spigot.findOne(spigot => spigot.version === version);
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
