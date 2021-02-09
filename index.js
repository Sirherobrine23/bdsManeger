/* eslint-disable no-irregular-whitespace */
console.log(`Running the Bds Maneger API in version ${require(__dirname+"/package.json").version}`)
var shell = require("shelljs");
let blanks;
function date(fu) {
    var today = new Date();
    if (fu == "year")
        return `${today.getFullYear()}`
    else if (fu == "day")
        return `${String(today.getDate()).padStart(2, "0")}`
    else if (fu == "month")
        return `${String(today.getMonth() + 1).padStart(2, "0")}`
    else if (fu == "hour")
        return `${today.getHours()}_${today.getMinutes()}`
    else 
        return `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}_${today.getHours()}-${today.getSeconds()}`
}
var electron_de
if (process.argv[0].includes("electron")){
    electron_de = true;
} else if (process.argv[0].includes("node")){
    electron_de = undefined;
    if (process.env.BDS_MONI == blanks){
        process.env.BDS_MONI = true
    }
    // process.env.BDS_MONI
    if (process.env.ENABLE_BDS_API == blanks){
        process.env.ENABLE_BDS_API = true
    }
    // process.env.ENABLE_BDS_API

} else {
    electron_de = false;
}
const arch = process.arch
var archi = arch
const path = require("path")
const fs = require("fs");
const { error } = require("console");
const package_root = path.join(process.cwd(), "package.json")
const package_root_builder = path.resolve(".", "resources", "app", "package.json")
var cache_dir,home,desktop,tmp,system
if (process.platform == "win32") {
    home = process.env.USERPROFILE;
    desktop = path.join(home, "Desktop")
    if (fs.existsSync(package_root)){
        cache_dir = path.join(home, "AppData", "Roaming", require(package_root).name)
    } else if (package_root_builder){
        cache_dir = path.join(home, "AppData", "Roaming", require(package_root_builder).name)
    } else {
        console.warn("Temporary Storages, some functions will be lost after restarting the system");
        cache_dir = path.join(process.env.TMP, "bds_tmp_configs");
    }
    tmp = process.env.TMP
    system = "windows";
} else if (process.platform == "linux") {
    home = process.env.HOME;
    if (fs.existsSync(package_root)){
        cache_dir = path.join(home, ".config", require(package_root).name);
    } else if (fs.existsSync(package_root_builder)) {
        cache_dir = path.join(home, ".config", require(package_root_builder).name);
    } else {
        console.warn("Temporary Storages, some functions will be lost after restarting the system");
        cache_dir = "/tmp/bds_tmp_configs";
    }
    var file = path.join(home, ".config", "user-dirs.dirs");var data = {};
    if (fs.existsSync(file)){
        let content = fs.readFileSync(file,"utf8");
        let lines = content.split(/\r?\n/g).filter((a)=> !a.startsWith("#"));
        for(let line of lines){
            let i = line.indexOf("=");
            if(i >= 0){
                try{data[line.substring(0,i)] = JSON.parse(line.substring(i + 1))}
                catch(e){
                    error(e)
                }
            }
        }
    }
    if(data["XDG_DESKTOP_DIR"]){
        desktop = data["XDG_DESKTOP_DIR"];
        desktop = desktop.replace(/\$([A-Za-z\-_]+)|\$\{([^{^}]+)\}/g, (_, a, b) => (process.env[a || b] || ""))}
        else{desktop = "/tmp"}
    
    tmp = "/tmp";
    system = "linux";
} else if (process.platform == "darwin") {
    require("open")("https://github.com/Bds-Maneger/Bds_Maneger/wiki/systems-support#a-message-for-mac-os-users")
    console.error("Please use Windows or Linux MacOS Not yet supported")
    process.exit(1984)
} else {
    console.log(`Please use an operating system (OS) compatible with Minecraft Bedrock Server ${process.platform} is not supported`);
    process.exit(2021)
}
// ---------
// ---------
if (typeof fetch === "undefined"){
    global.fetch = require("node-fetch")
}
if (typeof localStorage === "undefined"){
    var localStorageS = require("node-localstorage").LocalStorage;
    global.localStorage = new localStorageS(path.join(cache_dir, "Local_Storage"));
}
var bds_dir = path.join(home, "bds_Server");
var bds_dir_bedrock = path.join(bds_dir, "bedrock");
var bds_dir_java = path.join(bds_dir, "java");
var bds_dir_backup = path.join(bds_dir, "backups");
module.exports.backup_folder = bds_dir_backup

if (!(fs.existsSync(bds_dir))){
    console.log("Creating the bds directory")
    fs.mkdirSync(bds_dir)
    if (!(fs.existsSync(bds_dir))) shell.mkdir("-p", bds_dir);
}

// Configs
const bds_config_file = path.join(bds_dir, "bds_config.json")
if (fs.existsSync(bds_config_file)){
    var bds_config = JSON.parse(fs.readFileSync(bds_config_file, "utf8"))
} else {
    const bds_config = {
        "bds_platform": "bedrock",
        "telegram_token": "not User defined"
    }
    fs.writeFileSync(bds_config_file, JSON.stringify(bds_config))
}
module.exports.platform = bds_config.bds_platform
console.log(`Running on the "${bds_config.bds_platform}" platform`)
// Configs

var log_dir = path.join(bds_dir, "log");
var log_file = path.join(log_dir, `${date()}_${bds_config.bds_platform}_Bds_log.log`);
var log_date = date();

// ---------
// ---------



if (!(fs.existsSync(cache_dir))){
    console.log(`Creating a folder for Storage in ${cache_dir}`);
    fs.mkdirSync(cache_dir)
    if (!(fs.existsSync(cache_dir))) shell.mkdir("-p", cache_dir);
}
// e
if (!(fs.existsSync(bds_dir_java))){
    console.log("Creating the bds directory to Java")
    fs.mkdirSync(bds_dir_java)
    if (!(fs.existsSync(bds_dir_java))) shell.mkdir("-p", bds_dir_java);
}
if (!(fs.existsSync(bds_dir_bedrock))){
    console.log("Creating the bds directory to Bedrock")
    fs.mkdirSync(bds_dir_bedrock)
    if (!(fs.existsSync(bds_dir_bedrock))) shell.mkdir("-p", bds_dir_bedrock);
}
// e
if (!(fs.existsSync(log_dir))){
    if (!fs.existsSync(log_dir)){
        console.log(`Creating the bds log dir (${log_dir})`)
        fs.mkdirSync(log_dir)
        if (!(fs.existsSync(log_dir))) shell.mkdir("-p", log_dir)
    }
}
// e


/**
 * with this command we can change the platform with this script
 * 
 * bedrock change_platform("bedrock")
 * 
 * java change_platform("java")
 * @example change_platform("bedrock")
 */
function platform_update(plate){
    var complet_;
    if (plate === "java") complet_ = true
    else if (plate === "bedrock") complet_ = true
    else throw new console.error(`platform not identified or does not exist, ${plate} informed platform`);
    localStorage.setItem("nulle", complet_)
    const bds_config = path.join(bds_dir, "bds_config.json")
    try {
        const config_load = JSON.parse(fs.readFileSync(bds_config))
        config_load.bds_platform = plate
        fs.writeFileSync(bds_config, JSON.stringify(config_load))
        console.log(`upgrading the bedrock ${plate}`)
    } catch (error) {
        throw new console.error(`Something happened error code: ${error}`);
    }
}
if ((process.env.SERVER || "bedrock").includes("java", "JAVA")){
    platform_update("java")
}else{
    platform_update("bedrock")
}

module.exports.telegram_token_save = (token) =>{
    try {
        const bds_config = path.join(bds_dir, "bds_config.json")
        const config_load = JSON.parse(fs.readFileSync(bds_config))
        config_load.telegram_token = token
        fs.writeFileSync(bds_config, JSON.stringify(config_load))
        return true
    } catch {
        return false
    }
}

if (require("fs").existsSync(path.join(bds_dir, "telegram_token.txt"))){
    console.log(`We identified the old telegram token file (${path.join (bds_dir, "telegram_token.txt")}), starting the immigration process`)
    try {
        const token = fs.readFileSync(path.join(bds_dir, "telegram_token.txt"), "utf8").split("\n").join("")
        require("./index").telegram_token_save(token)
        fs.rmSync(path.join(bds_dir, "telegram_token.txt"))
        console.log("We finished migrating the old telegram token file")
    } catch {
        throw new error("It was not possible to move the old telegram token file to the new bds maneger api file")
    }
}

if (process.env.BDS_MONI == blanks){process.env.BDS_MONI = "false"}
if (process.env.ENABLE_BDS_API == blanks){process.env.ENABLE_BDS_API = "false"}


// Fetchs
fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/credentials.json").then(response => response.text()).then(gd_cre => {
    /**
     * backup credentials and an interesting design feature, plus privacy is important
     */
    module.exports.google_drive_credential = gd_cre
    /**
     * download the latest version of minecraft bedrock for android available, remember to use if you want ✌
     * 
     * you are taking responsibility for that
     */
    module.exports.mcpe_file = require("./global/auth").mcpe
    /**
     * perform a backup of the map, some resources are still under construction in the code more works
     * 
     * on the bedrock platform, all maps will be backed up into the "worlds" folder
     * 
     * on the java platform the map selected in the server configuration will be backed up, any other map will have to change in the server settings to perform the backup
     */
    module.exports.drive_backup= require("./global/auth").drive_backup
});
fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json").then(response => response.json()).then(rawOUT => {
    const versions = Object.getOwnPropertyNames(rawOUT.bedrock);
    for (let v in versions){
        var html = `${versions[v]}`;
        module.exports.version_select += `<option value="${html}">${html}</option>\n`;
        v++;
    }
    module.exports.bedrock_all_versions = Object.getOwnPropertyNames(rawOUT.bedrock);
    module.exports.java_all_versions = Object.getOwnPropertyNames(rawOUT.java);
    module.exports.bds_latest = rawOUT.bedrock_lateste;
    module.exports.bedrock_latest = rawOUT.bedrock_lateste;
    module.exports.java_latest = rawOUT.java_lateste;

    if (process.env.ENABLE_BDS_API.includes("true")){
        if (typeof bds_api_start === "undefined"){
            require("./API/api")();
            require("./API/log")();
        }
    } else {
        console.warn("The API via http is disabled, for more information, visit https://docs.srherobrine23.com/enable_bds_requests.html")
    }
    module.exports.get_version = (type) => {
        if (type == "raw")
            return rawOUT.Versions;
        else
            return require("./").version_select;
    }
})
// Fetchs

// Module export
/* Variaveis */
/**
 * this variable makes available the location of the user profile directory as
 * 
 * Linux: /home/USER/
 * 
 * Windows: C:\\Users\\USER\\
 * 
 * MacOS: not supported
 */
module.exports.home = home

/**
 * With different languages ​​and systems we want to find the user's desktop for some link in the directory or even a nice shortcut
 */
module.exports.desktop = desktop

/**
 * Identifying a system in the script can be simple with this variable
 */
module.exports.system = system

/**
 * The most important directory of this project, here are saved some important things like:
 * 
 * The server software
 * 
 * configuration of the Bds Manager API
 * 
 * Backups etc ...
 */
module.exports.bds_dir = bds_dir


module.exports.bds_dir_bedrock = bds_dir_bedrock
module.exports.bds_dir_java = bds_dir_java
module.exports.tmp_dir = tmp
module.exports.electron = electron_de
module.exports.api_dir = cache_dir
module.exports.log_file = log_file
module.exports.log_date = log_date
module.exports.arch = archi

// module.exports.token = JSON.parse(fs.readFileSync(path.join(bds_dir, "bds_config.json"))).telegram_token
module.exports.telegram_token = JSON.parse(fs.readFileSync(path.join(bds_dir, "bds_config.json"))).telegram_token


// Global commands
module.exports.telegram = require("./global/telegram_bot")
module.exports.change_platform = platform_update
module.exports.token_register = () => {
    if (!(fs.existsSync(path.join(bds_dir, "bds_tokens.json")))){
        fs.writeFileSync(path.join(bds_dir, "bds_tokens.json"), "[]")}
        require("crypto").randomBytes(10, function(err, buffer) {
            var token = buffer.toString("hex");
            console.log(token);
            var QRCode = require("qrcode");
            QRCode.toString(token, function (err) {
                if (err){console.log(err);}
                fs.readFile(path.join(bds_dir, "bds_tokens.json"), "utf8", function (err, data){
                    if (err){console.log(err);}
                    else {
                        var objeto = JSON.parse(data);
                        var count = Object.keys(objeto).length;
                        var teste = {count, token};
                        objeto.push(teste);
                        var json_ = JSON.stringify(objeto);
                        fs.writeFileSync(path.join(bds_dir, "bds_tokens.json"), json_, "utf8");}
                    });
                })
            })
}
module.exports.date = date
/**
 * sending commands more simply to the server
 * 
 * @example bds.command("say hello from Bds Maneger")
 */
module.exports.command = require("./global/command").command
// New management method

/**
 * to start the server here in the sera script with child_process, then you will have to use the return function for your log custumization or anything else
 * 
 * @example const server = bds.start();
 * server.on.stdout("date", function (log){console.log(log)})
 */
module.exports.start = require("./scripts/basic_server").start
/**
 * use this command for the server, that's all
 */
module.exports.stop = require("./scripts/basic_server").stop
/**
 * backup your map locally
 */
module.exports.backup = require("./scripts/backups").World_BAckup
/**
 * identify if there are any servers running in the background
 * 
 * @example bds.detect()
 * // true: if the server is running
 * // false: if not already
 */
module.exports.detect = require("./scripts/detect")
module.exports.bds_detect = require("./scripts/detect")

/**
 * @deprecated
 */
module.exports.version_Download = require("./scripts/bds_download")

/**
 * download some version of the java and Bedrock servers in the highest possible form
 * 
 * @example
 * bedrock: bds.download("1.16.201.02")
 * 
 * java: bds.download("1.16.5")
 */
module.exports.download = require("./scripts/bds_download")

/**
 * this function will be used to kill the server in the background
 */
module.exports.kill = require("./scripts/kill_server")
module.exports.config_example = require("./scripts/bds_settings").config_example
/**
 * use this command to modify server settings
 * 
 * @example
 * 
 * bds.set_config({
        name: "Bedrock our Java",
        description: "BDS Maneger",
        gamemode: "survival",
        difficulty: "normal",
        player_permission: "member",
        xbox: true,
        white_list: false,
        cheats: false,
        players: 100,
        port: 19132,
        port6: 19133
    })
 */
module.exports.set_config = require("./scripts/bds_settings").config
/**
 * takes the server settings in JSON format
 */
module.exports.get_config = require("./scripts/bds_settings").get_config
