const { join, resolve } = require("path");
const { existsSync, writeFileSync, mkdirSync, readFileSync } = require("fs");
const { homedir } = require("os");
const { valid_platform } = require("./BdsSystemInfo");
const yaml = {
    parse: require("js-yaml").load,
    stringify: require("js-yaml").dump
}

// PATHs
const home = homedir();
const bds_dir = join(home, "bds_core");
if (!(existsSync(bds_dir))) mkdirSync(bds_dir, {recursive: true})

// Set default platform for bds maneger
var default_platformConfig;
if (valid_platform["bedrock"]) default_platformConfig = "bedrock";
else if (valid_platform["java"]) default_platformConfig = "java";
else if (valid_platform["pocketmine"]) default_platformConfig = "pocketmine";
else default_platformConfig = "jsprismarine"

// Config Base to Bds Maneger Core and others Projects
var Config = {
    paths: {
        servers: join(bds_dir, "Servers"),
        backups: join(bds_dir, "Backups"),
        log: join(bds_dir, "Logs"),
        player: join(bds_dir, "Players.json")
    },
    bds: {
        enable_tmp_host: false
    },
    server: {
        platform: default_platformConfig,
        BackupCron: [
            {
                cron: "0 1 * * */3",
                Azure: false,
                Oracle: false,
                Google: false,
                Driver: false
            }
        ],
        versions: {
            bedrock: null,
            java: null,
            pocketmine: null,
            jsprismarine: null,
            spigot: null,
        },
        Settings: {
            java: {
                ram_mb: 1024
            }
        }
    },
    cloud: {
        Azure: {
            Account: null,
            AccountKey: null,
            Container: null
        },
        Oracle: {
            Bucket: null
        },
        Google: {},
        Driver: {
            RootID: null
        }
    },
    ban: [
        {
            username: "Steve",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
        },
        {
            username: "Alex",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
        },
        {
            username: "steve",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
        },
        {
            username: "alex",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
        }
    ],
    telegram: {
        admins: ["all_users"],
        token: null
    }
}

// Config
const ConfigPath = join(resolve(homedir(), "bds_core"), "BdsConfig.yaml")
function SaveConfig(){writeFileSync(ConfigPath, yaml.stringify(Config));}
if (existsSync(ConfigPath)) Config = {
    ...Config,
    ...yaml.parse(readFileSync(ConfigPath, "utf8"))
}; else writeFileSync(ConfigPath, yaml.stringify(Config))
process.on("exit", ()=>SaveConfig())

// Paths
if (!(existsSync(Config.paths["backups"]))) mkdirSync(Config.paths["backups"], {recursive: true})
if (!(existsSync(Config.paths["log"]))) mkdirSync(Config.paths["log"], {recursive: true})
if (!(existsSync(Config.paths["servers"]))) mkdirSync(Config.paths["servers"], {recursive: true})

// Server Paths
const ServersPaths = {
    bedrock: join(Config.paths.servers, "Bedrock"),
    java: join(Config.paths.servers, "Java"),
    pocketmine: join(Config.paths.servers, "Pocketmine-MP"),
    jsprismarine: join(Config.paths.servers, "JSPrismarine"),
}
for (let Servers of Object.getOwnPropertyNames(ServersPaths)) {
    if (!(existsSync(ServersPaths[Servers]))) {
        console.log(`Creating the ${Servers} Folder`);
        mkdirSync(ServersPaths[Servers], {recursive: true})
    }
}

// return settings by function
function GetJsonConfig(){
    return Config
}

// get the path from the settings and return by function
function GetPaths(path = null){
    if (!(path)) throw new Error("Set path to get");
    if (!(path === "all" || Config.paths[path])) throw new Error("Put a valid path: " + Object.getOwnPropertyNames(Config.paths).join(", "));
    if (path === "all") return Config.paths
    return Config.paths[path]
}

// Get the server paths if you don't send a throw
function GetServerPaths(path = null){
    if (!(path)) throw new Error("Set path to get");
    if (!(ServersPaths[path])) throw new Error("Put a valid path: " + Object.getOwnPropertyNames(ServersPaths).join(", "));
    return ServersPaths[path]
}

// Get the server settings for now it's only being used in Java
function GetServerSettings(platform = Config.server.platform){
    return Config.server.Settings[platform]
}

// Update the settings and save at the same time so as not to lose any information from the Bds Maneger settings
function UpdateServerVersion(version = null, platform = Config.server.platform){
    if (Config.server.versions[platform] || Config.server.versions[platform] === null) {
        Config.server.versions[platform] = version;
        SaveConfig()
        return Config.server.versions[platform]
    } else throw new Error("Platform invalid")
}

// Return an Object with all server versions installed
function GetServerVersion(){
    return Config.server.versions
}

// Catch Players/People from Servers/Telegram to be banned or removed from Server/Minecraft
function GetServerBan(){
    return Config.ban
}

// Cron for Backup
function GetCronBackup(){
    return Config.server.BackupCron
}

// Update the entire Bds Manager Core platform
function UpdatePlatform(platform = Config.server.platform){
    platform = platform.toLocaleLowerCase();
    if (/bedrock/.test(platform)) {
        Config.server.platform = "bedrock";
        SaveConfig()
    } else if (/java/.test(platform)) {
        Config.server.platform = "java";
        SaveConfig()
    } else if (/pocketmine/.test(platform)) {
        Config.server.platform = "pocketmine";
        SaveConfig()
    } else if (/jsprismarine/.test(platform)) {
        Config.server.platform = "jsprismarine";
        SaveConfig()
    } else throw new Error("platform no Exists")
    return platform
}

// Return to platform
function GetPlatform(){
    return Config.server.platform
}

// Telegram
function UpdateTelegramToken(token = null){
    if (!(token)) throw new Error("Telegram Token invalid")
    Config.telegram.token = token
    SaveConfig()
    return token
}

function GetTelegramToken(){
    return Config.telegram.token
}

function GetTelegramAdmins(){
    return Config.telegram.admins
}

// Get a temporary host to connect to the server.
function GetTempHost(){
    return Config.bds.enable_tmp_host
}

// Enable and/or disable pick up temporary host.
function UpdateTempHost(enable = false){
    // Check Boolean
    if (typeof enable !== "boolean") {console.log("Use Boolean, default false"); enable = false;}
    
    // Save
    Config.bds.enable_tmp_host = enable
    return SaveConfig();
}

// Get the server settings
function GetCloudConfig(cloud = null){
    if (!(cloud) || !(Config.cloud[cloud])) throw new Error("Cloud no exists");
    return Config.cloud[cloud]
}

// Settings Cloud
// Azure
function Azure_Settings(account = null, key = null, container = null){
    if (!(account)) throw new Error("Set Azure Blob Account")
    if (!(key)) throw new Error("Set Azure Blob Key")
    if (!(container)) throw new Error("Set Azure Container")
    Config.cloud.Azure.Account = account
    Config.cloud.Azure.AccountKey = key
    Config.cloud.Azure.Container = container
    SaveConfig()
    return {
        Account: Config.cloud.Azure.Account,
        Key: Config.cloud.Azure.AccountKey,
        Container: Config.cloud.Azure.Container
    }
}

// Oracle
function Oracle_Settings(bucket = null){
    if (!(bucket)) throw new Error("Set Oracle Bucket name")
    Config.cloud.Oracle.Bucket = bucket
    return {
        Bucket: bucket
    }
}

// Google Drive
function Google_Driver_Settings(rootid = null){
    if (!(rootid)) {rootid = null; console.log("No Backup folder id added for Google Driver");}
    Config.cloud.Driver.RootID = rootid
    SaveConfig()
    return {
        RootID: rootid
    }
}

module.exports = {
    bds_dir: bds_dir,
    GetJsonConfig,
    GetPaths,
    GetServerPaths,
    GetServerSettings,
    UpdateServerVersion,
    GetServerVersion,
    GetServerBan,
    GetCronBackup,
    UpdatePlatform,
    GetPlatform,
    UpdateTelegramToken,
    GetTelegramToken,
    GetTelegramAdmins,
    GetTempHost,
    UpdateTempHost,
    GetCloudConfig,
    CloudConfig: {
        Azure: Azure_Settings,
        Oracle: Oracle_Settings,
        Driver: Google_Driver_Settings
    }
}
