var AdmZip = require("adm-zip");
const { warn } = require("console");
const {writeFileSync, existsSync, readFileSync, readdirSync} = require("fs");
const { join, resolve } = require("path");
const {bds_config, bds_dir_bedrock, bds_dir_java, platform_version_update, valid_platform, PHPurlNames, bds_dir_pocketmine, PHPbinsUrls} = require("../index")
const bdsSystem = require("../index").system
const response = require("../index").SERVER_URLs
const commandExists = require("command-exists").sync
module.exports = function (version, force_install) {
    if (force_install === true) {
        bds_config.platform_version.java = "latest";
        bds_config.platform_version.bedrock = "latest"
        bds_config.platform_version.pocketmine = "latest"
    }
    try {
        if (version === "") version="latest"
        if (version === undefined) version="latest"
        const server_platform = bds_config.bds_platform
        var url;
        if (server_platform === "bedrock") {
            if (valid_platform.bedrock === true){
                var server_configs, permissions, whitelist
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
            } else throw Error("Bedrock Not suported")
        } else if (server_platform === "java") {
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
        } else  if (server_platform === "pocketmine") {
            if (valid_platform.pocketmine === true) {
                if (version === "latest") version = response.PocketMine_latest
                url = response.PocketMine[version].url
                console.log(`Server data publish: ${response.PocketMine[version].data}`)
                console.log(bds_dir_pocketmine);
                fetch(url).then(response => response.arrayBuffer()).then(response => Buffer.from(response)).then(response => {
                    writeFileSync(join(bds_dir_pocketmine, "PocketMine-MP.phar"), response, "binary")
                    console.log("PocketMine-MP.phar saved");
                    platform_version_update(version)
                    const binFolder = join(bds_dir_pocketmine, "bin")
                    var CheckBinPHPFolder;
                    if (existsSync(binFolder)) CheckBinPHPFolder = false
                    else if (commandExists("php")) CheckBinPHPFolder = false
                    else CheckBinPHPFolder = true
                    if (CheckBinPHPFolder||force_install) {
                        var urlPHPBin;
                        for (let nameFile of PHPurlNames){
                            var archS;
                            if (process.platform === "linux") if (process.arch === "x64") archS = "x86_64";
                            if (process.platform === "darwin") if (process.arch === "x64") archS = "x86_64";
                            if (process.platform === "win32") if (process.arch === "x64") archS = "x64";
                            var arch = false, system = false;
                            if (nameFile.includes(bdsSystem)) system = true
                            if (nameFile.includes(archS)) arch = true
                            // -*-*-*-*-
                            console.log({
                                arch,
                                system
                            });
                            if (arch === true && system === true){
                                urlPHPBin = PHPbinsUrls[nameFile]
                            }
                        }
                        if (urlPHPBin === undefined) throw Error("File not found")
                        else {
                            console.log(urlPHPBin);
                            fetch(urlPHPBin).then(response => response.arrayBuffer()).then(response => Buffer.from(response)).then(response => {
                                console.log("Download Sucess")
                                var zipExtractBin = new AdmZip(response);
                                zipExtractBin.extractAllTo(bds_dir_pocketmine, true)
                                console.log("Extract Sucess")
                                const phpBinFolder = resolve(bds_dir_pocketmine, "bin")
                                const phpIni = readFileSync(join(phpBinFolder, "php7", "bin", "php.ini"), "utf-8")
                                const phpIniSplit = phpIni.split("\n")
                                var check_extension_dir = false
                                for (let index in phpIniSplit){
                                    let test = phpIniSplit[index]
                                    if (test.includes("extension_dir")) check_extension_dir = true;
                                    console.log(test);
                                }
                                if (check_extension_dir) console.log("Skipping php.ini configuration");
                                else {
                                    const phpExtensiosnsDir = resolve(bds_dir_pocketmine, "bin/php7/lib/php/extensions")
                                    const phpExtensiosns = readdirSync(phpExtensiosnsDir)
                                    var exetensionZen;
                                    for (let index2 in phpExtensiosns){
                                        
                                        if (phpExtensiosns[index2].includes("debug-zts")) exetensionZen = phpExtensiosns[index2]
                                    }
                                    phpIniSplit.push(`extension_dir="${resolve(phpExtensiosnsDir, exetensionZen)}"`)
                                    writeFileSync(join(phpBinFolder, "php7", "bin", "php.ini"), phpIniSplit.join("\n"))
                                }
                                if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
                            })
                        }
                    } else if (process.env.BDS_DOCKER_IMAGE === "true") process.exit(0);
                })
            } else throw Error("Pocketmine not suported")
        } else throw Error("Bds maneger Config file error")
    } catch (error) {
        console.error(error);
    }
}
