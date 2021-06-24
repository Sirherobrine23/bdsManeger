/* eslint-disable no-irregular-whitespace */
const { resolve } = require("path");
const path = require("path")
const fs = require("fs");
const { randomBytes } = require("crypto")
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

const bds_core_package = resolve(__dirname, "package.json")
const package_json = JSON.parse(fs.readFileSync(bds_core_package))
module.exports.package_path = bds_core_package
module.exports.package_json = package_json
module.exports.extra_json = JSON.parse(fs.readFileSync(resolve(__dirname, "extra.json")))

const { bds_dir } = require("./lib/BdsSettings");
const { arch } = require("./lib/BdsSystemInfo");
const { Servers, PHPBin, GoogleDriver } = require("./lib/ServerURL");
const { GetPaths, GetJsonConfig, UpdatePlatform, UpdateTelegramToken, GetTelegramToken } = require("./lib/BdsSettings")
module.exports.arch = arch
if (typeof fetch === "undefined") global.fetch = require("node-fetch");


/* Minecraft Servers URLs and depedencies */
// urls
module.exports.SERVER_URLs = Servers
module.exports.ServerJson = Servers

// Get server version
module.exports.bedrock_all_versions = Object.getOwnPropertyNames(Servers.bedrock);
module.exports.java_all_versions = Object.getOwnPropertyNames(Servers.java);

// PHP Bins
module.exports.PHPbinsUrls = PHPBin

// PHP bins System availble in Json File
const PHPurlNames = Object.getOwnPropertyNames(PHPBin)
module.exports.PHPurlNames = PHPurlNames

// Google Drive Credentials
module.exports.GoogleDriveCredentials = GoogleDriver

const maneger_ips = require("./scripts/external_ip")
module.exports.internal_ip = maneger_ips.internal_ip
module.exports.external_ip = maneger_ips.external_ip
module.exports.save_google_id = require("./lib/BdsSettings").CloudConfig.Driver
module.exports.getBdsConfig = GetJsonConfig
module.exports.change_platform = module.exports.platform_update = UpdatePlatform
module.exports.telegram_token_save = UpdateTelegramToken
module.exports.api = require("./rest/api");

// ------------
const user_file_connected = GetPaths("player");
module.exports.players_files = user_file_connected
if (!(fs.existsSync(user_file_connected))) {
    let config = {};
    config["bedrock"] = {};
    config["java"] = {};
    config["pocketmine"] = {};
    config["jsprismarine"] = {};
    let NewJson = JSON.stringify(config, null, 4);
    fs.writeFileSync(user_file_connected, NewJson);
}

const file_user_check = fs.readFileSync(user_file_connected, "utf8");
try {
    JSON.parse(file_user_check)
} catch (error) {
    fs.renameSync(user_file_connected,  `${user_file_connected}_old_${Math.random()}_${new Date().getDate()}_${new Date().getMonth()}_${new Date().getFullYear()}.json`)
}

module.exports.telegram_token = GetTelegramToken();

function token_register() {
    const bds_token_path = path.join(bds_dir, "bds_tokens.json");
    if (!(fs.existsSync(bds_token_path))) fs.writeFileSync(bds_token_path, "[]");
    randomBytes((Math.trunc(15 * (10 * Math.random()))), function(err, buffer) {
        if (err) return console.warn(err);
        const new_token = buffer.toString("hex");
        var tokens = JSON.parse(fs.readFileSync(bds_token_path, "utf8"));
        tokens.push({token: new_token});
        fs.writeFileSync(bds_token_path, JSON.stringify(tokens, null, 4), "utf8");
        console.log(`Bds Maneger API REST token: "${new_token}"`);
    })
}

/**
 * Update, Get and more to Modifications Bds Settings File
 */
module.exports.BdsSettigs = require("./lib/BdsSettings");

// Requires
const { World_BAckup } = require("./scripts/backups");
const { config, get_config, config_example } = require("./scripts/ServerSettings");
const download = require("./scripts/download");
const { start, stop, BdsCommand } = require("./scripts/basic_server")

/**
 * Register tokens to use in Bds Maneger REST and other supported applications
 * 
 * @example token_register()
 */
module.exports.token_register = token_register

/**
 * Take the current date
 */
module.exports.BdsDate = module.exports.date = date

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
 * server.log(function (log){console.log(log)})
 */
module.exports.start = start
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

// Core Applications

/**
 * This is telegram bot
 */
module.exports.telegram = require("./rest/telegram_bot")


/**
 * Load Crontab Backup
 */
require("./scripts/LoadCronBackup")