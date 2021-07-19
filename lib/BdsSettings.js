const { join, resolve } = require("path");
const { existsSync, writeFileSync, mkdirSync, readFileSync } = require("fs");
const { homedir } = require("os");
const yaml = {
    parse: require("js-yaml").load,
    stringify: require("js-yaml").dump
}
const FetchSync = require("@the-bds-maneger/fetchsync");
const { external_ip } = require("../src/Scripts/external_ip");
const { valid_platform } = require("./BdsSystemInfo");

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


var Config = {
    paths: {
        servers: join(bds_dir, "Servers"),
        backups: join(bds_dir, "Backups"),
        log: join(bds_dir, "Logs"),
        player: join(bds_dir, "Players.json")
    },
    bds: {
        enable_tmp_host: false,
        temelemetry: {
            id: null,
            load: false
        }
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

// Telemetry
if (Config.bds.temelemetry.load) {
    if (!(Config.bds.temelemetry.id)) {
        Config.bds.temelemetry.id = FetchSync(`https://telemetry.the-bds-maneger.org/getid?external_ip=${JSON.stringify(external_ip)}`).text()
        SaveConfig()
    }
}

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

module.exports = {
    bds_dir: bds_dir,
    GetJsonConfig: function(){return Config},
    GetPaths: function(path = null){
        if (!(path)) throw new Error("Set path to get");
        if (!(path === "all" || Config.paths[path])) throw new Error("Put a valid path: " + Object.getOwnPropertyNames(Config.paths).join(", "));
        if (path === "all") return Config.paths
        return Config.paths[path]
    },
    GetServerPaths: function(path = null){
        if (!(path)) throw new Error("Set path to get");
        if (!(ServersPaths[path])) throw new Error("Put a valid path: " + Object.getOwnPropertyNames(ServersPaths).join(", "));
        return ServersPaths[path]
    },
    GetServerSettings: function(platform = Config.server.platform){
        return Config.server.Settings[platform]
    },
    UpdateServerVersion: function(version = null, platform = Config.server.platform){
        if (Config.server.versions[platform] || Config.server.versions[platform] === null) {
            Config.server.versions[platform] = version;
            SaveConfig()
            return Config.server.versions[platform]
        } else throw new Error("Platform invalid")
    },
    GetServerVersion: function(){return Config.server.versions},
    GetServerBan: function (){return Config.ban},
    GetCronBackup: function(){return Config.server.BackupCron},
    UpdatePlatform: function(platform = Config.server.platform){
        platform = platform.toLocaleLowerCase();
        if (platform === "bedrock") {
            Config.server.platform = "bedrock";
            SaveConfig()
        } else if (platform === "java") {
            Config.server.platform = "java";
            SaveConfig()
        } else if (platform === "pocketmine") {
            Config.server.platform = "pocketmine";
            SaveConfig()
        } else if (platform === "jsprismarine") {
            Config.server.platform = "jsprismarine";
            SaveConfig()
        } else throw new Error("platform no Exists")
        return platform
    },
    GetPlatform: function(){return Config.server.platform},
    UpdateTelegramToken: function (token = null){
        if (!(token)) throw new Error("Telegram Token invalid")
        Config.telegram.token = token
        SaveConfig()
        return token
    },
    GetTelegramToken: function(){
        return Config.telegram.token
    },
    GetTelegramAdmins: function(){
        return Config.telegram.admins
    },
    GetTempHost: function(){return Config.bds.enable_tmp_host},
    UpdateTempHost: function(enable = false){
        // Check Boolean
        if (typeof enable !== "boolean") {console.log("Use Boolean, default false"); enable = false;}
        
        // Save
        Config.bds.enable_tmp_host = enable
        return SaveConfig();
    },
    CloudConfig: {},
    GetCloudConfig: function(cloud = null){
        if (!(cloud) || !(Config.cloud[cloud])) throw new Error("Cloud no exists");
        return Config.cloud[cloud]
    }
}

module.exports.CloudConfig = {
    Azure: function(account = null, key = null, container = null){
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
    },
    Oracle: function(bucket = null){
        if (!(bucket)) throw new Error("Set Oracle Bucket name")
        Config.cloud.Oracle.Bucket = bucket
        return {
            Bucket: bucket
        }
    },
    Google: function(){throw new Error("doesn't work yet")},
    Driver: function(rootid = null){
        if (!(rootid)) {rootid = null; console.log("No Backup folder id added for Google Driver");}
        Config.cloud.Driver.RootID = rootid
        SaveConfig()
        return {
            RootID: rootid
        }
    }
}