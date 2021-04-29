/* eslint-disable no-irregular-whitespace */
const { resolve } = require("path");
const { error } = console;
const { execSync } = require("child_process");
const { CronJob } = require("cron");
const path = require("path")
const fs = require("fs");
const shell = require("shelljs");
const { getConfigHome } = require("./GetPlatformFolder")
const commandExistsSync = require("command-exists").sync;

const bds_core_package = resolve(__dirname, "package.json")
const bds_maneger_version = require(bds_core_package).version
if (process.env.SHOW_BDS_VERSION !== undefined) console.log(`Running the Bds Maneger API in version ${bds_maneger_version}`)
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
module.exports.package_path = bds_core_package

const { bds_dir, log_dir } = require("./bdsgetPaths");
module.exports = require("./bdsgetPaths");

// System Architect (x64, aarch64 and others)
const arch = process.arch
module.exports.arch = arch

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
var system, valid_platform
if (process.platform == "win32") {
    system = "Windows";
    // ia32
    valid_platform = {
        "bedrock": true,
        "pocketmine": true,
        "java": true,
        "jsprismarine": true
    }
} else if (process.platform == "linux") {
    system = "Linux";
    valid_platform = {
        "bedrock": true,
        "pocketmine": true,
        "java": true,
        "jsprismarine": true
    }
} else if (process.platform == "darwin") {
    if (arch === "arm64") require("open")("https://github.com/The-Bds-Maneger/core/wiki/system_support#information-for-users-of-macbooks-and-imacs-with-m1-processor")
    else require("open")("https://github.com/The-Bds-Maneger/core/wiki/system_support#macos-with-intel-processors");
    system = "MacOS";
    valid_platform = {
        "bedrock": false,
        "pocketmine": true,
        "java": true,
        "jsprismarine": true
    }
} else {
    console.log(`The Bds Maneger Core does not support ${process.platform} systems, as no tests have been done.`);
    system = "Other";
    valid_platform = {
        "bedrock": false,
        "pocketmine": false,
        "java": true,
        "jsprismarine": false
    }
    process.exit(254)
}
/* ------------------------------------------------------------ Take the variables of different systems ------------------------------------------------------------ */

/**
 * Platforms valid from deferents systems
 */
module.exports.valid_platform = valid_platform

/**
  * Identifying a system in the script can be simple with this variable
  */
module.exports.system = system

const log_date = date();
module.exports.log_date = log_date;
module.exports.latest_log = path.join(bds_dir, "log", "latest.log");

if (typeof fetch === "undefined") global.fetch = require("node-fetch");
if (typeof localStorage === "undefined") {
    let Bdsname = JSON.parse(fs.readFileSync(resolve(__dirname, "package.json"))).name;
    let LocalStorageFolder = path.join(getConfigHome(), Bdsname)
    // Create localStorage folder
    if (!(fs.existsSync(LocalStorageFolder))) shell.mkdir("-p", LocalStorageFolder);
    if (!(fs.existsSync(LocalStorageFolder))) fs.mkdirSync(LocalStorageFolder)
    let Local = require("node-localstorage")
    global.localStorage = new Local.LocalStorage(path.join(LocalStorageFolder, "Local_Storage"));}

/* Minecraft Servers URLs and depedencies */
// urls

var CurlWgetCommand;
if (commandExistsSync("wget")) CurlWgetCommand = "wget -qO-";
else if (commandExistsSync("curl")) CurlWgetCommand = "curl -sS";
else throw new Error("Curl or Wget command not found")

const SERVER_URLs = JSON.parse(execSync(`${CurlWgetCommand} "https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json"`).toString())
module.exports.SERVER_URLs = SERVER_URLs

// PHP Bins
const PHPbinsUrl = JSON.parse(execSync(`${CurlWgetCommand} "https://raw.githubusercontent.com/The-Bds-Maneger/Raw_files/main/php_bin.json"`).toString())
module.exports.PHPbinsUrls = PHPbinsUrl

// PHP bins System availble in Json File
const PHPurlNames = Object.getOwnPropertyNames(PHPbinsUrl)
module.exports.PHPurlNames = PHPurlNames

// Google Drive Credentials
const GoogleDriveCredentials = JSON.parse(execSync("curl -sS \"https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/credentials.json\"").toString())
module.exports.GoogleDriveCredentials = GoogleDriveCredentials

/* ---------------------------------------------------------------------------- Variables ---------------------------------------------------------------------------- */
// Configs
var bds_config, bds_config_file = path.join(bds_dir, "bds_config.json");
const current_version_bds_core = bds_maneger_version

// Set default platform for bds maneger
var default_platformConfig;
if (process.platform.includes("win32", "linux")) default_platformConfig = "bedrock";else default_platformConfig = "java"

// Config File
if (fs.existsSync(bds_config_file)) bds_config = JSON.parse(fs.readFileSync(bds_config_file, "utf8"));else bds_config = {platform_version: {}, telegram_admin: ["all_users"]}
bds_config = {
    "version": current_version_bds_core,
    "bds_pages": (bds_config.bds_pages || "default"),
    "bds_platform": (bds_config.bds_platform || default_platformConfig),
    "platform_version": {
        "bedrock": (bds_config.platform_version.bedrock || "latest"),
        "java": (bds_config.platform_version.java || "latest"),
        "pocketmine": (bds_config.platform_version.pocketmine || "latest"),
        "jsprismarine": "latest"
    },
    "bds_ban": (bds_config.bds_ban || ["Steve", "Alex", "steve", "alex"]),
    "telegram_token": (bds_config.telegram_token || "not User defined"),
    "Google_Drive_root_backup_id": (bds_config.Google_Drive_root_backup_id || undefined),
    "BackupCron": (bds_config.BackupCron||[]),
    "telegram_admin": bds_config.telegram_admin
}
fs.writeFileSync(bds_config_file, JSON.stringify(bds_config, null, 4))
bds_config_export()

/**
 * Update bds config version installed
 * 
 * @param bedrock
 * @param java
 * @param pocketmine
 */
module.exports.platform_version_update = function (version){
    let bds_config = JSON.parse(fs.readFileSync(bds_config_file, "utf8"))
    if (bds_config.bds_platform === "bedrock") bds_config.platform_version.bedrock = version
    else if (bds_config.bds_platform === "java") bds_config.platform_version.java = version
    else if (bds_config.bds_platform === "pocketmine") bds_config.platform_version.pocketmine = version
    else if (bds_config.bds_platform === "jsprismarine") bds_config.platform_version.jsprismarine = version
    fs.writeFileSync(bds_config_file, JSON.stringify(bds_config, null, 4))
    bds_config_export()
};

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
module.exports.bds_platform = bds_config.bds_platform

/**
 * Bds Maneger Latest log file.
 */
const log_file = path.join(log_dir, `${date()}_${bds_config.bds_platform}_Bds_log.log`);
module.exports.log_file = log_file

function bds_config_export (){
    const Config = JSON.parse(fs.readFileSync(path.join(bds_dir, "bds_config.json"), "utf8"))
    /**
     * Get current bds core config
     * 
     * @example bds_config.bds_platform // return bedrock, java, pocketmine or jsprismarine
     * 
     */
    module.exports.bds_config = Config
    module.exports.platform = Config.bds_platform
}
bds_config_export()

function getBdsConfig (){
    const Config = fs.readFileSync(path.join(bds_dir, "bds_config.json"), "utf8")
    return JSON.parse(Config)
}
module.exports.getBdsConfig = getBdsConfig

/**
 * Get system CPU and ram memorie utilazations
 */
module.exports.system_monitor = require("./scripts/system_monitor")

/**
 * with this command we can change the platform with this script
 * 
 * bedrock change_platform("bedrock")
 * 
 * java change_platform("java")
 * 
 * pocketmine change_platform("pocketmine")
 * 
 * jsprismarine change_platform("jsprismarine")
 * 
 * @example change_platform("bedrock")
 * 
 * @param "bedrock"
 * @param "java"
 * @param "pocketmine"
 * @param "jsprismarine"
 */
function platform_update(plate){
    // Server platform detect
    if (!(plate === "java" || plate === "bedrock" || plate === "pocketmine" || plate === "jsprismarine")) throw new Error(`platform not identified or does not exist, ${plate} informed platform`);
    // Platforma Update
    const bds_config = path.join(bds_dir, "bds_config.json");
    try {
        const config_load = JSON.parse(fs.readFileSync(bds_config))
        config_load.bds_platform = plate
        fs.writeFileSync(bds_config, JSON.stringify(config_load, null, 4))
        console.log(`upgrading the platform ${plate}`)
        bds_config_export()
        return true
    } catch (error) {
        throw new Error(`Something happened error: ${error}`)
    }
}

module.exports.change_platform = platform_update
module.exports.platform_update = platform_update

if (process.env.SERVER !== undefined){
    let PlaformSelectServer = (process.env.SERVER || "bedrock")
    if (PlaformSelectServer.includes("java", "JAVA")) platform_update("java");
    else if (PlaformSelectServer.includes("bedrock", "BEDROCK")) platform_update("bedrock");
    else if (PlaformSelectServer.includes("pocketmine", "POCKETMINE", "pocketmine-mp", "POCKETMINE-MP")) platform_update("pocketmine");
    else if (PlaformSelectServer.includes("JSPrismarine", "JSPRISMARINE", "jsprismarine")) platform_update("jsprismarine");
    else throw new Error("Server Plaform Error: "+process.env.SERVER)
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

// Get server version
module.exports.bedrock_all_versions = Object.getOwnPropertyNames(SERVER_URLs.bedrock);
module.exports.java_all_versions = Object.getOwnPropertyNames(SERVER_URLs.java);
module.exports.bds_latest = (SERVER_URLs.bedrock_lateste||SERVER_URLs.bedrock_latest);
module.exports.bedrock_latest = SERVER_URLs.bedrock_latest;
module.exports.java_latest = SERVER_URLs.java_latest;

/**
 * Activate an API via expresss.js, to receive requests via http such as the log, send and receive commands
 * 
 * to activate use:
 * * bds.api() // to activate requests via http
 * * bds.log()
 */
module.exports.api = require("./rest/api");
module.exports.rest = require("./rest/api");

module.exports.package_json = JSON.parse(fs.readFileSync(bds_core_package))

// ------------
const user_file_connected = path.join(bds_dir, "bds_usersV2.json")
/**
 * get the location of the file where the player history connected to the server is saved
 */
module.exports.players_files = user_file_connected

if (!(fs.existsSync(user_file_connected))) fs.writeFileSync(user_file_connected, "{}")
const file_user_check = fs.readFileSync(user_file_connected, "utf8");
if (file_user_check.charAt(0) !== "{") console.warn("ok, we have an error in the file of the connected players, please check the file, it should start on the first line with --> [ ,and end with -->]")
else if (file_user_check.slice(-1) !== "}") console.warn("ok, we have an error in the file of the connected players, please check the file, it should start on the first line with --> [ ,and end with -->]")

module.exports.telegram_token = bds_config.telegram_token

module.exports.internal_ip = require("./scripts/external_ip").internal_ip
module.exports.external_ip = require("./scripts/external_ip").ip

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

// Requires
const { World_BAckup } = require("./scripts/backups");
const { stop, BdsCommand } = require("./scripts/basic_server");
const { config, get_config, config_example } = require("./scripts/bds_settings");
const { mcpe, drive_backup } = require("./scripts/GoogleDrive");
const download = require("./scripts/download");


const Jobs = {};
for (let index of bds_config.BackupCron) {
    Jobs[index] = new CronJob(index, function() {
        World_BAckup()
    });
}
module.exports.CronBackups = Jobs

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
module.exports.command = BdsCommand
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
module.exports.stop = stop
/**
 * backup your map locally
 */
module.exports.backup = World_BAckup
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
module.exports.download = download

/**
 * this function will be used to kill the server in the background
 */
module.exports.kill = require("./scripts/kill_server")
module.exports.config_example = config_example

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
module.exports.set_config = config
/**
 * takes the server settings in JSON format
 */
module.exports.get_config = get_config

/**
 * download the latest version of minecraft bedrock for android available, remember to use if you want ✌
 * 
 * you are taking responsibility for that
 */
module.exports.mcpe_file = mcpe

/**
 * perform a backup of the map, some resources are still under construction in the code more works
 * 
 * on the bedrock platform, all maps will be backed up into the "worlds" folder
 * 
 * on the java platform the map selected in the server configuration will be backed up, any other map will have to change in the server settings to perform the backup
 */
module.exports.drive_backup = drive_backup
