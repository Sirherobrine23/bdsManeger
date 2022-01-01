const fs = require("fs");
const path = require("path");
const os = require("os");
const yaml = require("js-yaml");
const deepmerge = require("deepmerge");

// PATHs
const home = os.homedir(),
  bds_dir = path.join(home, "bds_core"),
  ExternalPlugins = path.join(bds_dir, "plugins");

if (!(fs.existsSync(bds_dir))) fs.mkdirSync(bds_dir, {recursive: true});
if (!(fs.existsSync(ExternalPlugins))) fs.mkdirSync(ExternalPlugins, {recursive: true});

// Config Base to Bds Maneger Core and others Projects
var Config = {
  paths: {
    servers: path.join(bds_dir, "Servers"),
    backups: path.join(bds_dir, "Backups"),
    log: path.join(bds_dir, "Logs"),
    player: path.join(bds_dir, "Players.json")
  },
  bds: {
    enable_tmp_host: false
  },
  server: {
    platform: "bedrock",
    BackupCron: [
      {
        enabled: false,
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
      spigot: null,
      dragonfly: null
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
      bedrock: true,
      java: true,
      pocketmine: true,
      jsprismarine: true,
      spigot: true,
    }
  ],
  telegram: {
    admins: ["all_users"],
    ban: ["Steve_mine_mine"],
    token: ""
  }
}

// Config
const ConfigPath = path.join(bds_dir, "BdsConfig.yaml")

const SaveConfig = () => fs.writeFileSync(ConfigPath, yaml.dump(Config));
process.on("exit", () => SaveConfig());

if (fs.existsSync(ConfigPath)) {
  Config.ban = [];
  Config.server.BackupCron = [];
  Config.telegram.admins = [];
  Config.telegram.ban = [];
  try {Config = deepmerge(Config, yaml.load(fs.readFileSync(ConfigPath, "utf8")));} catch (e) {console.log(e);}
} else fs.writeFileSync(ConfigPath, yaml.dump(Config))

// Paths
if (!(fs.existsSync(Config.paths["backups"]))) fs.mkdirSync(Config.paths["backups"], {recursive: true})
if (!(fs.existsSync(Config.paths["log"]))) fs.mkdirSync(Config.paths["log"], {recursive: true})
if (!(fs.existsSync(Config.paths["servers"]))) fs.mkdirSync(Config.paths["servers"], {recursive: true})

// Server Paths
const ServersPaths = {
  bedrock: path.join(Config.paths.servers, "Bedrock"),
  java: path.join(Config.paths.servers, "Java"),
  pocketmine: path.join(Config.paths.servers, "Pocketmine-MP"),
  dragonfly: path.join(Config.paths.servers, "Dragonfly_go"),
  spigot: path.join(Config.paths.servers, "Spigot")
}

Object.getOwnPropertyNames(ServersPaths).map(Servers => ServersPaths[Servers]).forEach(Servers => {
  if (!(fs.existsSync(Servers))) {
    console.log(`Creating the ${path.basename(Servers)} Folder`);
    fs.mkdirSync(Servers, {recursive: true})
  }
});

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
  if (path === "all") return ServersPaths
  return ServersPaths[path]
}

// Update the settings and save at the same time so as not to lose any information from the Bds Maneger settings
function UpdateServerVersion(version = null, platform = Config.server.platform){
  if (Config.server.versions[platform] || Config.server.versions[platform] === null) {
    Config.server.versions[platform] = version;
    SaveConfig()
    return Config.server.versions[platform]
  } else throw new Error("Platform invalid")
}

// Update the entire Bds Manager Core platform
function UpdatePlatform(platform = "null"){
  platform = platform.toLocaleLowerCase();
  if (/bedrock/.test(platform)) {
    Config.server.platform = "bedrock";
  } else if (/java/.test(platform)) {
    Config.server.platform = "java";
  } else if (/pocketmine/.test(platform)) {
    Config.server.platform = "pocketmine";
  } else if (/spigot/.test(platform)) {
    Config.server.platform = "spigot";
  } else if (/dragonfly/.test(platform)) {
    Config.server.platform = "dragonfly";
  } else throw new Error("platform no exists");
  SaveConfig();
  return platform
}

// Telegram
function UpdateTelegramToken(token = null){
  if (!(token)) throw new Error("Telegram Token invalid")
  Config.telegram.token = token
  SaveConfig()
  return token
}

const GetJsonConfig = () => Config;

const GetCronBackup = () => Config.server.BackupCron;
const GetPlatform = () => Config.server.platform;

const GetServerBan = () => Config.ban;
const GetServerVersion = () => Config.server.versions;
const GetServerSettings = (platform = Config.server.platform) => Config.server.Settings[platform];

const GetTelegramToken = () => Config.telegram.token;
const GetTelegramAdmins = () => Config.telegram.admins;

// Get a temporary host to connect to the server.
const GetTempHost = () => Config.bds.enable_tmp_host

// Enable and/or disable pick up temporary host.
function UpdateTempHost(enable = false){
  // Check Boolean
  if (typeof enable !== "boolean") {console.log("Use Boolean, default false"); enable = false;}

  // Save
  Config.bds.enable_tmp_host = enable
  SaveConfig();
  return true;
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

// Create Player JSON
if (!(fs.existsSync(GetPaths("player")))) {
  const PlayerBase = {}
  for (let ServerPlat of Object.getOwnPropertyNames(Config.server.versions)) PlayerBase[ServerPlat] = [];
  fs.writeFileSync(GetPaths("player"), JSON.stringify(PlayerBase, null, 2));
} else {
  const PlayerBase = JSON.parse(fs.readFileSync(GetPaths("player"), "utf8"));
  for (let ServerPlat of Object.getOwnPropertyNames(Config.server.versions)) if (!(PlayerBase[ServerPlat])) PlayerBase[ServerPlat] = [];
  fs.writeFileSync(GetPaths("player"), JSON.stringify(PlayerBase, null, 2));
}

module.exports = {
  bds_dir: bds_dir,
  BdsDir: bds_dir,
  ExternalPlugins: ExternalPlugins,
  ServersPaths: ServersPaths,
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
