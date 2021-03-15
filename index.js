/* eslint-disable no-irregular-whitespace */
if (process.env.IS_BIN_BDS === undefined) console.log(`Running the Bds Maneger API in version ${require(__dirname+"/package.json").version}`)
var shell = require("shelljs");
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
} else {
    electron_de = false;
}
const arch = process.arch
var archi = arch
const path = require("path")
const fs = require("fs");
const { error } = console;
function package_location (){
    if (fs.existsSync(path.join(process.cwd(), "package.json"))) return path.join(process.cwd(), "package.json")
    else if (fs.existsSync(path.resolve(".", "resources", "app", "package.json"))) return path.resolve(".", "resources", "app", "package.json")
    else if (fs.existsSync(path.resolve(__dirname, "package.json"))) return path.resolve(__dirname, "package.json")
    else path.resolve(".", "package.json")
}
const package_root = package_location();
var cache_dir,home,desktop,tmp,system
module.exports.package_path = package_root
const tmp_men = "We were unable to locate some files, a temporary folder will be created, after restarting the server or computer some saved functions will be lost"
if (process.platform == "win32") {
    home = process.env.USERPROFILE;
    desktop = path.join(home, "Desktop")
    if (fs.existsSync(package_root)) cache_dir = path.join(home, "AppData", "Roaming", require(package_root).name)
    else {
        console.warn(tmp_men);
        cache_dir = path.join(process.env.TMP, "bds_tmp_configs");
    }
    tmp = process.env.TMP
    system = "windows";
} else if (process.platform == "linux") {
    home = process.env.HOME;
    if (fs.existsSync(package_root)) cache_dir = path.join(home, ".config", require(package_root).name);
    else {
        console.warn(tmp_men);
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
        desktop = desktop.replace(/\$([A-Za-z\-_]+)|\$\{([^{^}]+)\}/g, (_, a, b) => (process.env[a || b] || ""))
    }
    else if (process.env.BDS_DOCKER_IMAGE) desktop = "/home/bds/"
    else desktop = "/tmp"
    tmp = "/tmp";
    system = "linux";
} else if (process.platform == "darwin") {
    require("open")("https://github.com/Bds-Maneger/Bds_Maneger/wiki/systems-support#a-message-for-mac-os-users")
    console.error("MacOS is not yet supported, wait until it is (You can use the docker)")
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
var bds_config, bds_config_file;
bds_config_file = path.join(bds_dir, "bds_config.json")
if (fs.existsSync(bds_config_file)){
    bds_config = JSON.parse(fs.readFileSync(bds_config_file, "utf8"))
} else {
    bds_config = {
        "bds_platform": "bedrock",
        "telegram_token": "not User defined",
        "version": "latest",
        "telegram_admin": [
            "all_users"
        ]
    }
    fs.writeFileSync(bds_config_file, JSON.stringify(bds_config, null, 4))
}
module.exports.platform = bds_config.bds_platform
var log_dir = path.join(bds_dir, "log");
var log_file = path.join(log_dir, `${date()}_${bds_config.bds_platform}_Bds_log.log`);
var log_date = date();
function bds_config_export (){
    /**
     * Get current bds core config
     * 
     * @example bds.bds_config.bds_platform // return bedrock or java
     * 
     * * it updates every second
     */
    module.exports.bds_config = JSON.parse(fs.readFileSync(path.join(bds_dir, "bds_config.json")))
}
bds_config_export()
if (!(fs.existsSync(cache_dir))){
    console.log(`Creating a folder for Storage in ${cache_dir}`);
    fs.mkdirSync(cache_dir)
    if (!(fs.existsSync(cache_dir))) shell.mkdir("-p", cache_dir);
}
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
if (!(fs.existsSync(log_dir))){
    if (!fs.existsSync(log_dir)){
        console.log(`Creating the bds log dir (${log_dir})`)
        fs.mkdirSync(log_dir)
        if (!(fs.existsSync(log_dir))) shell.mkdir("-p", log_dir)
    }
}
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
        fs.writeFileSync(bds_config, JSON.stringify(config_load, null, 4))
        console.log(`upgrading the platform ${plate}`)
        bds_config_export()
    } catch (error) {
        throw new console.error(`Something happened error code: ${error}`);
    }
}
if (process.env.SERVER !== undefined){
    if ((process.env.SERVER || "bedrock").includes("java", "JAVA")) platform_update("java");
    else platform_update("bedrock");
}


const telegram_token_save = function (token) {
    try {
        const bds_config = path.join(bds_dir, "bds_config.json")
        const config_load = JSON.parse(fs.readFileSync(bds_config))
        config_load.telegram_token = token
        fs.writeFileSync(bds_config, JSON.stringify(config_load, null, 4))
        bds_config_export()
        return true
    } catch {
        return false
    }
}
module.exports.telegram_token_save = telegram_token_save


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
    module.exports.mcpe_file = require("./scripts/auth").mcpe
    /**
     * perform a backup of the map, some resources are still under construction in the code more works
     * 
     * on the bedrock platform, all maps will be backed up into the "worlds" folder
     * 
     * on the java platform the map selected in the server configuration will be backed up, any other map will have to change in the server settings to perform the backup
     */
    module.exports.drive_backup= require("./scripts/auth").drive_backup
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
    module.exports.get_version = (type) => {
        if (type == "raw")
            return rawOUT.Versions;
        else
            return require("./").version_select;
    }
})
// Fetchs


/**
 * Activate an API via expresss.js, to receive requests via http such as the log, send and receive commands
 * 
 * to activate use:
 * * bds.api() // to activate requests via http
 * * bds.log()
 */
module.exports.api = require("./API/api");

// Module export
/* Variaveis */
/**
 * this variable makes available the location of the user profile directory as
 * 
 * Linux: /home/USER/
 * 
 * Windows: C:\\Users\\USER\\
 * 
 * MacOS: In tests
 */
module.exports.home = home

/**
 * get the location of the file where the player history connected to the server is saved
 * 
 */
const user_file_connected = path.join(bds_dir, "bds_users.json")
module.exports.players_files = user_file_connected
if (!(fs.existsSync(user_file_connected))) fs.writeFileSync(user_file_connected, "[]")
const file_user_check = fs.readFileSync(user_file_connected, "utf8");
const primeira_letra = file_user_check.charAt(0)
const ultima_letra = file_user_check.slice(-1)
if (primeira_letra !== "[") console.warn("ok, we have an error in the file of the connected players, please check the file, it should start on the first line with --> [and end with -->]")
else if (ultima_letra !== "]") console.warn("ok, we have an error in the file of the connected players, please check the file, it should start on the first line with --> [and end with -->]")
else console.info("the files of the connected players are ok !!!")
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
module.exports.latest_log = path.join(bds_dir, "log", "latest.log")


// module.exports.token = JSON.parse(fs.readFileSync(path.join(bds_dir, "bds_config.json"))).telegram_token
module.exports.telegram_token = JSON.parse(fs.readFileSync(path.join(bds_dir, "bds_config.json"))).telegram_token


// Global commands
module.exports.telegram = require("./scripts/telegram_bot")
module.exports.change_platform = platform_update
module.exports.token_register = () => {
    const QRCode = require("qrcode");
    const bds_token_path = path.join(bds_dir, "bds_tokens.json") 
    if (!(fs.existsSync(bds_token_path))) fs.writeFileSync(bds_token_path, "[]")

    require("crypto").randomBytes(10, function(err, buffer) {
        if (err) console.warn(err);
        const new_token = buffer.toString("hex");

        var tokens = JSON.parse(fs.readFileSync(bds_token_path, "utf8"));
        tokens.push({"token": new_token});
        fs.writeFileSync(bds_token_path, JSON.stringify(tokens, null, 4), "utf8");

        console.log(new_token);
        
        QRCode.toString(new_token, {type:"terminal"}, function (err, url) {
            if (err) console.warn(err)
            console.log(url)
        })
    })
}
module.exports.date = date
/**
 * sending commands more simply to the server
 * 
 * @example bds.command("say hello from Bds Maneger")
 */
module.exports.command = require("./scripts/command").command
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
 * 
 * use bds.download
 */
module.exports.version_Download = require("./scripts/bds_download")

/**
 * download some version of the java and Bedrock servers in the highest possible form
 * 
 * @example
 * bedrock: bds.download("1.16.201.02")
 * 
 * java: bds.download("1.16.5")
 * 
 * any platform: bds.download("latest") // It will download the latest version available for download
 */
module.exports.download = require("./scripts/download")

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
