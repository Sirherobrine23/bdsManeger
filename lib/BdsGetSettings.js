const { join, resolve } = require("path");
const { existsSync, writeFileSync, mkdirSync, readFileSync } = require("fs");
const PackageJson = require("../package.json");
const { homedir } = require("os");
const yaml = {
    parse: require("js-yaml").load,
    stringify: require("js-yaml").dump
}
const FetchSync = require("./fetchSync");
const { external_ip } = require("../scripts/external_ip")

// PATHs
const home = homedir();
const bds_dir = join(home, "bds_core");
if (!(existsSync(bds_dir))) mkdirSync(bds_dir, {recursive: true})

var Config = {
    version: PackageJson.version,
    paths: {
        server: resolve(bds_dir, "Servers"),
        backups: resolve(bds_dir, "Backups"),
        log: resolve(bds_dir, "Logs")
    },
    bds: {
        temelemetry: {
            id: null,
            load: false
        }
    },
    server: {
        platform: "bedrock",
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
            jsprismanarine: null,
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
        "Steve",
        "Alex",
        "steve",
        "alex"
    ],
    telegram: {
        admins: [],
        token: null
    }
}

// Config
const ConfigPath = join(resolve(homedir(), "bds_core"), "BdsConfig.yaml")
function SaveConfig(){writeFileSync(ConfigPath, yaml.stringify(Config));}
if (existsSync(ConfigPath)) Config = yaml.parse(readFileSync(ConfigPath, "utf8")); else writeFileSync(ConfigPath, yaml.stringify(Config));
process.on("exit", ()=>SaveConfig())

// Telemetry
if (Config.bds.temelemetry.load) {
    if (!(Config.bds.temelemetry.id)) {
        Config.bds.temelemetry.id = FetchSync(`https://telemetry.the-bds-maneger.org/getid?external_ip=${external_ip}`).text()
        SaveConfig()
    }
}

module.exports = {
    GetPaths: function(path = null){
        if (!(path)) throw new Error("Set path to get");
        if (!(Config.paths[path])) throw new Error("Put a valid path: " + Object.getOwnPropertyNames(Config.paths).join(", "));
        return Config.paths[path]
    },
    UpdateServerVersion: function(version = null, platform = Config.server.platform){
        if (Config.server.versions[platform]) {
            Config.server.versions[platform] = version;
            SaveConfig()
            return Config.server.versions[platform]
        } else throw new Error("Platform invalid")
    },
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
    SetTelegramToken: function (token = null){
        if (!(token)) throw new Error("Telegram Token invalid")
        Config.telegram.token = token
        SaveConfig()
        return token
    },
    GetTelegramToken(){
        if (Config.telegram.token) return Config.telegram.token;
        else throw new Error("Set Telegram Token!")
    },
    cloud: {
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
}