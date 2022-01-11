const fs = require("fs");
const path = require("path");
const os = require("os");
const yaml = require("js-yaml");
const deepmerge = require("deepmerge");

// Config/Base Paths
const home = os.homedir(), bds_dir = path.join(home, "bds_core");
if (!(fs.existsSync(bds_dir))) fs.mkdirSync(bds_dir, {recursive: true});

/**
 * Server Config Base
 */
let BdsConfig = {
  version: 2.9, 
  paths: {
    Backup: path.join(bds_dir, "Backups"),
    Log: path.join(bds_dir, "Logs"),
    Player: path.join(bds_dir, "Players.json"),
    Servers: path.join(bds_dir, "Servers"),
    ServersConfig: {
      bedrock: "Bedrock",
      java: "Java",
      pocketmine: "Pocketmine-MP",
      spigot: "Spigot",
      dragonfly: "Dragonfly_go",
    }
  },
  server: {
    platform: "bedrock",
    versions: {
      bedrock: "",
      java: "",
      pocketmine: "",
      spigot: "",
      dragonfly: ""
    },
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
    Settings: {
      java: {
        ram: 1024
      }
    },
    ban: [
      {
        username: "Steve",
        bedrock: true,
        java: true,
        pocketmine: true,
        spigot: true,
        dragonfly: true
      }
    ],
  },
  telegram: {
    token: "",
    admins: [],
    ban: [],
  }
}

// Config
const ConfigPath = path.join(bds_dir, "BdsConfig.yaml");
const SaveConfig = () => fs.writeFileSync(ConfigPath, yaml.dump(BdsConfig));

if (fs.existsSync(ConfigPath)) {
  BdsConfig.ban = [];
  BdsConfig.server.BackupCron = [];
  BdsConfig.telegram.admins = [];
  BdsConfig.telegram.ban = [];
  try {BdsConfig = deepmerge(BdsConfig, yaml.load(fs.readFileSync(ConfigPath, "utf8")));} catch (e) {console.log(e);}
} else fs.writeFileSync(ConfigPath, yaml.dump(BdsConfig))

// Paths
if (!(fs.existsSync(BdsConfig.paths["Backup"]))) fs.promises.mkdir(BdsConfig.paths["Backup"], {recursive: true}).catch(e => console.log(e));
if (!(fs.existsSync(BdsConfig.paths["Log"]))) fs.promises.mkdir(BdsConfig.paths["Log"], {recursive: true}).catch(e => console.log(e));
if (!(fs.existsSync(BdsConfig.paths["Servers"]))) fs.promises.mkdir(BdsConfig.paths["Servers"], {recursive: true}).catch(e => console.log(e));

for (const Servers of Object.keys(BdsConfig.paths.ServersConfig).map(Servers => path.join(BdsConfig.paths.Servers, BdsConfig.paths.ServersConfig[Servers]))) {
  if (!(fs.existsSync(Servers))) {
    fs.promises.mkdir(Servers, {recursive: true}).catch(e => console.log(e));
  }
}

/**
 * Find path to Bds Core and the Bds Servers platform
 */
function GetPaths(PlatformOrPath = "", IsServers = false){
  if (IsServers) {
    if (PlatformOrPath === "all") return {
      RootServers: BdsConfig.paths.Servers,
      Platforms: BdsConfig.paths.ServersConfig
    }
    else if (BdsConfig.paths.ServersConfig[PlatformOrPath]) return path.join(BdsConfig.paths.Servers, BdsConfig.paths.ServersConfig[PlatformOrPath]);
  } else {
    if (PlatformOrPath === "all") return BdsConfig.paths;
    else if (BdsConfig.paths[PlatformOrPath]) return BdsConfig.paths[PlatformOrPath];
  }
  return undefined;
}

// Create Player JSON
if (!(fs.existsSync(BdsConfig.paths.Player))) {
  const PlayerBase = {}
  for (let ServerPlat of Object.keys(BdsConfig.server.versions)) PlayerBase[ServerPlat] = [];
  fs.writeFileSync(BdsConfig.paths.Player, JSON.stringify(PlayerBase, "", 2));
} else {
  const PlayerBase = JSON.parse(fs.readFileSync(BdsConfig.paths.Player, "utf8"));
  for (let ServerPlat of Object.keys(BdsConfig.server.versions)) if (!(PlayerBase[ServerPlat])) PlayerBase[ServerPlat] = [];
  fs.writeFileSync(BdsConfig.paths.Player, JSON.stringify(PlayerBase, "", 2));
}

/**
 * Update Server Version
 */
function UpdateServerVersion(version = "", platform = BdsConfig.server.platform){
  version = version.trim();
  if (!version) throw new Error("Version invalid")
  if (BdsConfig.server.versions[platform] === undefined) throw new Error("Platform invalid");
  if (BdsConfig.server.versions[platform] === version) return;
  BdsConfig.server.versions[platform] = version;
  SaveConfig();
  return;
}

// Update the entire Bds Manager Core platform
function ChangePlatform(platform = ""){
  if (!platform) throw new Error("Platform invalid");
  platform = platform.toLocaleLowerCase().trim();
  if (/bedrock/.test(platform)) {
    BdsConfig.server.platform = "bedrock";
  } else if (/java/.test(platform)) {
    BdsConfig.server.platform = "java";
  } else if (/pocketmine|pocketmine-mp/.test(platform)) {
    BdsConfig.server.platform = "pocketmine";
  } else if (/spigot/.test(platform)) {
    BdsConfig.server.platform = "spigot";
  } else if (/dragonfly/.test(platform)) {
    BdsConfig.server.platform = "dragonfly";
  } else throw new Error("platform no exists");
  SaveConfig();
  return BdsConfig.server.platform;
}

/**
 * Return Latest Bds Maneger Config
 */
function GetBdsConfig() {return BdsConfig;}

/**
 * Update and Get Telegram Bot Token
 */
function telegramToken(Token = "") {
  if (Token) {
    BdsConfig.telegram.token = Token;
    SaveConfig();
  }
  return BdsConfig.telegram.token;
}

/**
 * Get Current Bds Manager Platform
 */
function CurrentPlatorm() {return BdsConfig.server.platform;}

module.exports = {
  BdsDir: bds_dir,
  GetBdsConfig,
  GetPaths,
  UpdateServerVersion,
  ChangePlatform,
  CurrentPlatorm,
  more: {
    telegramToken
  }
}
