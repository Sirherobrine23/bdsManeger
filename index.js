/* eslint-disable no-irregular-whitespace */
const { resolve } = require("path");
const path = require("path")
const fs = require("fs");
const randomUUID = require("uuid").v4;
const { bds_dir } = require("./lib/BdsSettings");

if (typeof fetch === "undefined") global.fetch = require("node-fetch");

const bds_core_package = resolve(__dirname, "package.json")
module.exports.package_path = bds_core_package
module.exports.package_json = require("./package.json");
module.exports.extra_json = require("./BdsManegerInfo.json");

// Inport and Export Arch
const { arch } = require("./lib/BdsSystemInfo");
module.exports.arch = arch

const { GetJsonConfig, UpdatePlatform, UpdateTelegramToken } = require("./lib/BdsSettings");

// Bds Maneger Core Network
const maneger_ips = require("./src/BdsNetwork")
module.exports.internal_ip = maneger_ips.internal_ip
module.exports.external_ip = maneger_ips.external_ip
module.exports.tmphost = {
    host: maneger_ips.host,
    Response: maneger_ips.HostResponse
}

// Get Old Method Config
module.exports.getBdsConfig = GetJsonConfig;

/**
 * Update Current Platform
 */
module.exports.change_platform = module.exports.platform_update = UpdatePlatform;

/**
 * Save Telegram token in Settings File
 */
module.exports.telegram_token_save = UpdateTelegramToken

/**
 * The Bds Maneger Core Internal API REST
 * 
 * @param {number} port - The port number, default is 1932
 * 
 * @param {function} callback - The callback function after start API
 */
module.exports.api = require("./src/rest/api");

function token_register() {
    const bds_token_path = path.join(bds_dir, "bds_tokens.json");
    if (!(fs.existsSync(bds_token_path))) fs.writeFileSync(bds_token_path, "[]");
    const tokens = JSON.parse(fs.readFileSync(bds_token_path, "utf8"));
    
    // Get UUID
    const getBdsUUId = randomUUID().split("-");
    const bdsuid = "bds_" + (getBdsUUId[0]+getBdsUUId[2].slice(0, 15));
    
    // Save BdsUUID
    tokens.push({
        token: bdsuid,
        date: new Date(),
        scopers: ["admin"]
    });
    fs.writeFileSync(bds_token_path, JSON.stringify(tokens, null, 4), "utf8");
    console.log(`Bds Maneger API REST token: "${bdsuid}"`);
    return bdsuid;
}

/**
 * Register tokens to use in Bds Maneger REST and other supported applications
 * 
 * @example token_register()
 */
module.exports.token_register = token_register

/**
 * Update, Get and more to Modifications Bds Settings File
 */
module.exports.BdsSettigs = require("./lib/BdsSettings");

// Requires
const { World_BAckup } = require("./src/BdsBackup");
const { config, get_config } = require("./src/ServerSettings");
const download = require("./src/BdsServersDownload");
const { start, stop, BdsCommand, CronBackups } = require("./src/BdsManegerServer")

/**
 * sending commands more simply to the server
 * 
 * @example bds.command("say hello from Bds Maneger")
 */
module.exports.command = BdsCommand
// New management method

// Start Server
/**
 * to start the server here in the sera script with child_process, then you will have to use the return function for your log custumization or anything else
 * 
 * @example const server = bds.start();
 * server.log(function (log){console.log(log)})
 */
module.exports.start = start

// Stop Server
/**
 * use this command for the server, that's all
 */
module.exports.stop = stop

// Create Backup of Bds Maneger Core and Servers along with your maps and settings
/**
 * backup your map locally
 */
module.exports.backup = World_BAckup

const { Kill, Detect } = require("./src/CheckKill")

/**
 * identify if there are any servers running in the background
 * 
 * @example bds.detect()
 * true: if the server is running
 * false: if not already
 */
module.exports.detect = Detect
module.exports.bds_detect = Detect

/**
 * this function will be used to kill the server in the background
 */
module.exports.kill = Kill

/**
 * download some version of the java and Bedrock servers in the highest possible form
 * 
 * use download( version, boolean ) // the boolean is for if you want to force the installation of the server
 * 
 * @example
 * bedrock: download("1.16.201.02")
 * 
 * java: download("1.16.5")
 * 
 * any platform: download("latest") // It will download the latest version available for download
 */
module.exports.download = download

/**
 * use this command to modify server settings
 * 
 * @example set_config({
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
    });
 */
module.exports.set_config = config

/**
 * takes the server settings in JSON format
 */
module.exports.get_config = get_config

/**
 * Load Crontab Backup
 */
module.exports.Cron_Loaded = CronBackups;
