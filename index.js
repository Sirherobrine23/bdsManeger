/* eslint-disable no-irregular-whitespace */
const path = require("path")
const fs = require("fs");
const { randomUUID } = require("crypto");
const { bds_dir } = require("./lib/BdsSettings");

// Bds Maneger Core Package JSON File
module.exports.package_path = path.resolve(__dirname, "package.json");
module.exports.package_json = require("./package.json");
module.exports.extra_json = require("./BdsManegerInfo.json");
module.exports.BdsCoreVersion = module.exports.package_json.version;

// Inport and Export Arch
const { arch } = require("./lib/BdsSystemInfo");
module.exports.arch = arch

// Core Settings
const { GetJsonConfig, UpdatePlatform, UpdateTelegramToken } = require("./lib/BdsSettings");
module.exports.getBdsConfig = GetJsonConfig;
module.exports.change_platform = UpdatePlatform;
module.exports.platform_update = UpdatePlatform;
module.exports.telegram_token_save = UpdateTelegramToken;

// Platforms Checkers
const { CheckSystemAsync, GetKernel } = require("./lib/BdsSystemInfo");
module.exports.CheckSystem = CheckSystemAsync;
module.exports.GetKernel = GetKernel;

// Bds Maneger Core Network
const BdsNetwork = require("./src/BdsNetwork")
module.exports.internal_ip = BdsNetwork.LocalInterfaces;
module.exports.external_ip = BdsNetwork.GetExternalPublicAddress;

// Bds Maneger Core API
const BdsManegerAPI = require("./src/api/api");
module.exports.api = BdsManegerAPI;
module.exports.BdsManegerAPI = BdsManegerAPI;

// Bds Maneger Core API token Register
const path_tokens = path.join(bds_dir, "bds_tokens.json");
function token_register(Admin_Scoper = ["web_admin", "admin"]) {
  Admin_Scoper = Array.from(Admin_Scoper).filter(scoper => /admin/.test(scoper));
  let tokens = [];
  if (fs.existsSync(path_tokens)) tokens = JSON.parse(fs.readFileSync(path_tokens, "utf8"));
  // Get UUID
  const getBdsUUId = randomUUID().split("-");
  const bdsuid = "bds_" + (getBdsUUId[0]+getBdsUUId[2].slice(0, 15));
  // Save BdsUUID
  tokens.push({
    token: bdsuid,
    date: new Date(),
    scopers: Admin_Scoper
  });
  fs.writeFileSync(path_tokens, JSON.stringify(tokens, null, 4), "utf8");
  return bdsuid;
}

// Bds Maneger Core API Delet token
function delete_token(Token = "") {
  if (!Token) return false;
  if (typeof Token !== "string") return false;
  let tokens = [];
  if (fs.existsSync(path_tokens)) tokens = JSON.parse(fs.readFileSync(path_tokens, "utf8"));
  if (tokens.filter(token => token.token === Token).length > 0) {
    fs.writeFileSync(path_tokens, JSON.stringify(tokens, null, 4), "utf8");
    return true;
  } else return false;
}

// Check Exists Tokens Files
if (!(fs.existsSync(path_tokens))) token_register();

// Server Settings
module.exports.token_register = token_register;
module.exports.bds_maneger_token_register = token_register;
module.exports.delete_token = delete_token;
module.exports.bds_maneger_delete_token = delete_token;

// Bds Maneger Settings
module.exports.BdsSettigs = require("./lib/BdsSettings");

// Bds Maneger Core Backups
const { World_BAckup } = require("./src/BdsBackup");
module.exports.backup = World_BAckup;
module.exports.core_backup = World_BAckup;

// Server Settings
const { config, get_config } = require("./src/ServerSettings");
module.exports.set_config = config;
module.exports.update_config = config;
module.exports.get_config = get_config;
module.exports.server_config = get_config;
module.exports.get_server_config = get_config;

// Dowloand Server
const download = require("./src/BdsServersDownload");
module.exports.download = download;
module.exports.download_server = download;

// Bds Maneger Core Server
const { start, stop, BdsCommand } = require("./src/BdsManegerServer")
module.exports.command = BdsCommand;
module.exports.server_command = BdsCommand;
module.exports.start = start;
module.exports.stop = stop;

// Process Manager Kill and Detect Server
const { Kill, Detect } = require("./src/CheckKill")
module.exports.detect = Detect;
module.exports.bds_detect = Detect;
module.exports.detect_server = Detect;
module.exports.kill = Kill;
