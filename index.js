/* eslint-disable no-irregular-whitespace */
const path = require("path")
const fs = require("fs");
const { resolve } = require("path");
const { error } = console;
const shell = require("shelljs");
const { getDesktopFolder, getConfigHome } = require("./GetPlatformFolder")
const { execSync } = require("child_process");

const bds_core_package = resolve(__dirname, "package.json")
const bds_maneger_version = require(bds_core_package).version
if (process.env.IS_BIN_BDS === undefined) console.log(`Running the Bds Maneger API in version ${bds_maneger_version}`)
function date(format) {
    const today = new Date(),
        yaer = today.getFullYear(),
        day = String(today.getDate()).padStart(2, "0"),
        month = String(today.getMonth() + 1).padStart(2, "0"),
        hour = today.getHours(),
        minute = today.getMinutes();
    // ---------------------------------------------------------
    if (format === "year") return yaer
    else if (format === "day") return day
    else if (format === "month") return month
    else if (format === "hour") return hour
    else if (format === "minute") return minute
    else if (format === "hour_minu") return `${hour}-${minute}`
    else return `${day}-${month}-${yaer}_${hour}-${minute}`
}

// System Architect (X64 or ARM64)
const arch = process.arch
module.exports.arch = arch

var home, tmp, system, valid_platform
module.exports.package_path = bds_core_package
if (process.platform == "win32") {
    home = process.env.USERPROFILE;
    tmp = process.env.TMP
    system = "Windows";
    valid_platform = {
        "bedrock": true,
        "pocketmine": true,
        "java": true
    }
} else if (process.platform == "linux") {
    home = process.env.HOME;
    tmp = "/tmp";
    system = "Linux";
    valid_platform = {
        "bedrock": true,
        "pocketmine": true,
        "java": true
    }
    if (process.arch === "aarch64") valid_platform.pocketmine = false;
} else if (process.platform == "darwin") {
    if (arch === "arm64") require("open")("https://github.com/The-Bds-Maneger/core/wiki/system_support#information-for-users-of-macbooks-and-imacs-with-m1-processor")
    else require("open")("https://github.com/The-Bds-Maneger/core/wiki/system_support#macos-with-intel-processors");
    home = process.env.HOME;
    tmp = "/tmp";
    system = "MacOS";
    valid_platform = {
        "bedrock": false,
        "pocketmine": true,
        "java": true
    }
} else {
    console.log(`The Bds Maneger Core does not support ${process.platform} systems, as no tests have been done.`);
    home = process.env.HOME;
    tmp = "/tmp";
    system = "Other";
    valid_platform = {
        "bedrock": false,
        "pocketmine": false,
        "java": true
    }
    process.exit(254)
}

/* ------------------------------------------------------------ Take the variables of different systems ------------------------------------------------------------ */


const desktop = getDesktopFolder()
/**
 * With different languages ​​and systems we want to find the user's desktop for some link in the directory or even a nice shortcut
 */
module.exports.desktop = desktop

/**
 * Platforms valid from deferents systems
 */
module.exports.valid_platform = valid_platform

/**
  * Identifying a system in the script can be simple with this variable
  */
module.exports.system = system

/**
 * Temporary system directory
 */
module.exports.tmp_dir = tmp

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

// save bds core files
const bds_dir = resolve(home, "bds_core");
const old_bds_dir = resolve(home, "bds_Server");

// Bds Backups Folder
var bds_dir_backup = path.join(bds_dir, "backups");
module.exports.backup_folder = bds_dir_backup

// Move old configs to new folder
if (fs.existsSync(old_bds_dir)){
    if (fs.existsSync(bds_dir)) {
        fs.renameSync(old_bds_dir, old_bds_dir+"_Conflit_"+Math.trunc(Math.random()* 10000 * Math.random()));
        throw Error("Conflit folders check home dir")
    } else {
        console.log("Moving the old files to the new folder");
        fs.renameSync(old_bds_dir, bds_dir);
    }
}

// Create Main save files
if (!(fs.existsSync(bds_dir))){
    console.log("Creating the bds directory")
    fs.mkdirSync(bds_dir)
    if (!(fs.existsSync(bds_dir))) shell.mkdir("-p", bds_dir);
}
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

// Servers Paths
/* Java Path */
const bds_dir_java = path.join(bds_dir, "java");
if (!(fs.existsSync(bds_dir_java))){
    console.log("Creating the bds directory to Java")
    fs.mkdirSync(bds_dir_java)
    if (!(fs.existsSync(bds_dir_java))) shell.mkdir("-p", bds_dir_java);
}
module.exports.bds_dir_java = bds_dir_java

/* Bedrock Path */
const bds_dir_bedrock = path.join(bds_dir, "bedrock");
if (!(fs.existsSync(bds_dir_bedrock))){
    console.log("Creating the bds directory to Bedrock")
    fs.mkdirSync(bds_dir_bedrock)
    if (!(fs.existsSync(bds_dir_bedrock))) shell.mkdir("-p", bds_dir_bedrock);
}
module.exports.bds_dir_bedrock = bds_dir_bedrock

/* PocketMine Path */
const bds_dir_pocketmine = path.join(bds_dir, "pocketmine");
if (!(fs.existsSync(bds_dir_pocketmine))){
    console.log("Creating the bds directory to Pocketmine")
    fs.mkdirSync(bds_dir_pocketmine)
    if (!(fs.existsSync(bds_dir_pocketmine))) shell.mkdir("-p", bds_dir_pocketmine);
}
module.exports.bds_dir_pocketmine = bds_dir_pocketmine

// Create backup folder
if (!(fs.existsSync(bds_dir_backup))){
    fs.mkdirSync(bds_dir_backup)
    if (!(fs.existsSync(bds_dir_backup))) shell.mkdir("-p", bds_dir_backup);
}

// Link Bds Dir in Desktop
let fileShortcut;
if (process.platform === "win32") fileShortcut = ".lnk";else fileShortcut = "";
const BdsCoreInDesktop = resolve(desktop, "Bds Maneger Core"+fileShortcut)
if (!(fs.existsSync(BdsCoreInDesktop))) {
    console.log("Creating a Bds Core shortcut on the Desktop")
    if (process.platform === "win32") require("create-desktop-shortcuts")({
        windows: {
            filePath: bds_dir,
            name: "Bds Maneger Core"
        }
    });
    else fs.symlinkSync(bds_dir, BdsCoreInDesktop)
}

// Log Dir
const log_dir = path.join(bds_dir, "log");
const log_date = date();
module.exports.log_date = log_date
module.exports.latest_log = path.join(bds_dir, "log", "latest.log")
if (!(fs.existsSync(log_dir))){
    fs.mkdirSync(log_dir)
    if (!fs.existsSync(log_dir)){
        console.log(`Creating the bds log dir (${log_dir})`)
        if (!(fs.existsSync(log_dir))) shell.mkdir("-p", log_dir)
    }
}

if (typeof fetch === "undefined") global.fetch = require("node-fetch");
if (typeof localStorage === "undefined") {
    let LocalStorageFolder = path.join(getConfigHome(), "bds_core")
    // Create localStorage folder
    if (!(fs.existsSync(LocalStorageFolder))) shell.mkdir("-p", LocalStorageFolder);
    if (!(fs.existsSync(LocalStorageFolder))) fs.mkdirSync(LocalStorageFolder)
    global.localStorage = new require("node-localstorage").LocalStorage(path.join(LocalStorageFolder, "Local_Storage"));}

/* Minecraft Servers URLs and depedencies */
// urls
const SERVER_URLs = JSON.parse(execSync("curl -sS \"https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json\"").toString())
module.exports.SERVER_URLs = SERVER_URLs

// PHP Bins
const PHPbinsUrl = JSON.parse(execSync("curl -sS \"https://raw.githubusercontent.com/The-Bds-Maneger/Raw_files/main/php_bin.json\"").toString())
module.exports.PHPbinsUrls = PHPbinsUrl

// PHP bins System availble in Json File
const PHPurlNames = Object.getOwnPropertyNames(PHPbinsUrl)
module.exports.PHPurlNames = PHPurlNames

/* ---------------------------------------------------------------------------- Variables ---------------------------------------------------------------------------- */
// Configs
var bds_config, bds_config_file = path.join(bds_dir, "bds_config.json");
const current_version_bds_core = bds_maneger_version
var default_platformConfig;
if (process.platform.includes("win32", "linux")) default_platformConfig = "bedrock"
else default_platformConfig = "java"
if (fs.existsSync(bds_config_file)){
    bds_config = JSON.parse(fs.readFileSync(bds_config_file, "utf8"))
    if (bds_config.version !== current_version_bds_core){
        
        if (bds_config.platform_version === undefined) bds_config.platform_version = {}
        // New Config JSon
        bds_config = {
            "version": current_version_bds_core,
            "bds_pages": (bds_config.bds_pages||"default"),
            "bds_platform": (bds_config.bds_platform||default_platformConfig),
            "platform_version": {
                "bedrock": (bds_config.platform_version.bedrock||"latest"),
                "java": (bds_config.platform_version.java||"latest")
            },
            "bds_ban": (bds_config.bds_ban||["Steve", "Alex", "steve", "alex"]),
            "telegram_token": (bds_config.telegram_token||undefined),
            "Google_Drive_root_backup_id": (bds_config.Google_Drive_root_backup_id||undefined)
        }
        fs.writeFileSync(bds_config_file, JSON.stringify(bds_config, null, 4))
        bds_config_export()
    }
} else {
    let ram_total = Math.trunc((require("os").freemem() / 1000 / 1000) - 212)
    if (ram_total >= 1000) ram_total = ram_total - 1000
    bds_config = {
        "version": current_version_bds_core,
        "bds_pages": "default",
        "bds_platform": default_platformConfig,
        "platform_version": {
            "bedrock": "latest",
            "java": "latest"
        },
        "bds_ban": ["Steve", "Alex", "steve", "alex"],
        "telegram_token": "not User defined",
        "Google_Drive_root_backup_id": undefined,
        "telegram_admin": [
            "all_users"
        ]
    }
    fs.writeFileSync(bds_config_file, JSON.stringify(bds_config, null, 4))
}
module.exports.platform_version_update = function (version){
    let bds_config = JSON.parse(fs.readFileSync(bds_config_file, "utf8"))
    if (bds_config.bds_platform === "bedrock") bds_config.platform_version.bedrock = version
    else if (bds_config.bds_platform === "java") bds_config.platform_version.java = version
    fs.writeFileSync(bds_config_file, JSON.stringify(bds_config, null, 4))
    bds_config_export()
}


/**
 * Save ID Google Drive folder to Backups
 */
module.exports.save_google_id = function (id){
    let bds_config = JSON.parse(fs.readFileSync(bds_config_file, "utf8"))
    bds_config.Google_Drive_root_backup_id = id
    fs.writeFileSync(bds_config_file, JSON.stringify(bds_config, null, 4))
    bds_config_export()
    return true
}
module.exports.platform = bds_config.bds_platform

/**
 * Bds Maneger Latest log file.
 */
const log_file = path.join(log_dir, `${date()}_${bds_config.bds_platform}_Bds_log.log`);
module.exports.log_file = log_file

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

/**
 * with this command we can change the platform with this script
 * 
 * bedrock change_platform("bedrock")
 * 
 * java change_platform("java")
 * @example change_platform("bedrock")
 */
function platform_update(plate){
    // Server platform detect
    if (plate === "java") null;
    else if (plate === "bedrock") null;
    else if (plate === "pocketmine") null;
    else throw new Error(`platform not identified or does not exist, ${plate} informed platform`);

    // Platforma Update
    const bds_config = path.join(bds_dir, "bds_config.json")
    try {
        const config_load = JSON.parse(fs.readFileSync(bds_config))
        config_load.bds_platform = plate
        fs.writeFileSync(bds_config, JSON.stringify(config_load, null, 4))
        console.log(`upgrading the platform ${plate}`)
        bds_config_export()
        return true
    } catch (error) {
        throw new Error(`Something happened error code: ${error}`)
    }
}
if (process.env.SERVER !== undefined){
    if ((process.env.SERVER || "bedrock").includes("java", "JAVA")) platform_update("java");
    else platform_update("bedrock");
}
module.exports.change_platform = platform_update

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
    console.log(`We identified the old telegram token file (${path.join (bds_dir, "telegram_token.txt")}), starting the migration process`)
    try {
        const token = fs.readFileSync(path.join(bds_dir, "telegram_token.txt"), "utf8").split("\n").join("")
        telegram_token_save(token)
        fs.rmSync(path.join(bds_dir, "telegram_token.txt"))
        console.log("We finished migrating the old telegram token file")
    } catch {
        throw new error("It was not possible to move the old telegram token file to the new bds maneger api file")
    }
}
const getSize = require("get-folder-size");
getSize(bds_dir_backup, function(err, info) {
    if (err) throw err
    function toGB(x) {return (x / (1024 * 1024 * 1024)).toFixed(1);}
    /**
     * The disk space is used for each backup made, and it is good to take a look at this information before creating another backup.
     * 
     * The return value will always be in gigabyte (GB)
     */
    module.exports.backup_folder_size = toGB(info)
});

// Get server version
fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json").then(response => response.json()).then(rawOUT => {
    module.exports.bedrock_all_versions = Object.getOwnPropertyNames(rawOUT.bedrock);
    module.exports.java_all_versions = Object.getOwnPropertyNames(rawOUT.java);
    module.exports.bds_latest = (rawOUT.bedrock_lateste||rawOUT.bedrock_latest);
    module.exports.bedrock_latest = rawOUT.bedrock_latest;
    module.exports.java_latest = rawOUT.java_latest;
})

/**
 * Activate an API via expresss.js, to receive requests via http such as the log, send and receive commands
 * 
 * to activate use:
 * * bds.api() // to activate requests via http
 * * bds.log()
 */
module.exports.api = require("./rest/api");
module.exports.rest = require("./rest/api");

// ------------
const user_file_connected = path.join(bds_dir, "bds_users.json")
/**
 * get the location of the file where the player history connected to the server is saved
 */
module.exports.players_files = user_file_connected
if (!(fs.existsSync(user_file_connected))) fs.writeFileSync(user_file_connected, "[]")
const file_user_check = fs.readFileSync(user_file_connected, "utf8");
if (file_user_check.charAt(0) !== "[") console.warn("ok, we have an error in the file of the connected players, please check the file, it should start on the first line with --> [ ,and end with -->]")
else if (file_user_check.slice(-1) !== "]") console.warn("ok, we have an error in the file of the connected players, please check the file, it should start on the first line with --> [ ,and end with -->]")
module.exports.telegram_token = JSON.parse(fs.readFileSync(path.join(bds_dir, "bds_config.json"))).telegram_token
module.exports.internal_ip = require("./scripts/external_ip").internal_ip
module.exports.telegram = require("./scripts/telegram_bot")


const token_register = function (username, passworld) {
    const bds_token_path = path.join(bds_dir, "bds_tokens.json") 
    if (!(fs.existsSync(bds_token_path))) fs.writeFileSync(bds_token_path, "[]")
    function getRandomNumber (){
        const number = Math.trunc(15 * (10 * Math.random()))
        if (number < 10) return getRandomNumber()
        else if (number > 15) return getRandomNumber()
        else return number
    }
    let number = getRandomNumber()
    require("crypto").randomBytes(number, function(err, buffer) {
        if (err) console.warn(err);
        const new_token = buffer.toString("hex");

        var tokens = JSON.parse(fs.readFileSync(bds_token_path, "utf8"));
        tokens.push({
            "token": (passworld||new_token),
            "user": (username||"all")
        });
        fs.writeFileSync(bds_token_path, JSON.stringify(tokens, null, 4), "utf8");

        console.log(`Bds Maneger API REST token: "${new_token}"`);
        if (process.stdout.isTTY === false) {
            require("qrcode").toString(new_token, {type: "terminal"}, function (err, url) {
                if (err) throw Error(err)
                console.log(url)
            })
        }
    })
}

/**
 * Register tokens to use in Bds Maneger REST and other supported applications
 * 
 * @example token_register()
 */
module.exports.token_register = token_register

/**
 * Take the current date
 */
module.exports.date = date
/**
 * sending commands more simply to the server
 * 
 * @example bds.command("say hello from Bds Maneger")
 */
module.exports.command = require("./scripts/basic_server").BdsCommand
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
 * use download( version, boolean ) // the boolean is for if you want to force the installation of the server
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
 * @example bds.set_config({
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

/**
 * download the latest version of minecraft bedrock for android available, remember to use if you want ✌
 * 
 * you are taking responsibility for that
 */
module.exports.mcpe_file = require("./scripts/GoogleDrive").mcpe

/**
 * perform a backup of the map, some resources are still under construction in the code more works
 * 
 * on the bedrock platform, all maps will be backed up into the "worlds" folder
 * 
 * on the java platform the map selected in the server configuration will be backed up, any other map will have to change in the server settings to perform the backup
 */
module.exports.drive_backup= require("./scripts/GoogleDrive").drive_backup