/* eslint-disable no-irregular-whitespace */
// process.env.ShowLoadTime = true;
// Load Root JSON
const BdsManegerCoreJSONs = {
  Package: require("../package.json"),
  Extra: require("./BdsManegerInfo.json")
};

// Bds Maneger Core Version
module.exports.version = BdsManegerCoreJSONs.Package.version;
const ExtraJSON = BdsManegerCoreJSONs;
module.exports.ExtraJSON = ExtraJSON;

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Settings");
const BdsSettings = require("./lib/BdsSettings");
module.exports.BdsSettings = BdsSettings;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Token");
const BdsToken = require("./lib/Token");
module.exports.BdsToken = BdsToken;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Token");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: System Info");
const BdsSystemInfo = require("./lib/BdsSystemInfo");
module.exports.BdsSystemInfo = BdsSystemInfo;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: System Info");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Network");
const BdsNetwork = require("./BdsNetwork");
module.exports.BdsNetwork = BdsNetwork;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Network");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Backups");
const BdsBackup = require("./BdsBackup");
module.exports.BdsBackup = BdsBackup;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Backups");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Settings");
const BdsServerSettings = require("./ServerSettings");
module.exports.BdsServerSettings = BdsServerSettings;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Download Server");
const BdsDownload = require("./BdsServersDownload");
module.exports.BdsDownload = BdsDownload;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Download Server");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Check And Kill");
const BdsCkeckKill = require("./CheckKill");
module.exports.BdsCkeckKill = BdsCkeckKill;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Check And Kill");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: API");
const BdsManegerAPI = require("./api");
module.exports.BdsManegerAPI = BdsManegerAPI;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: API");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Maneger");
const BdsManegerServer = require("./ServerManeger");
module.exports.BdsManegerServer = BdsManegerServer;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Maneger");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Plugin Maneger");
const BdsServerPlugins = require("./PluginManeger");
module.exports.BdsServerPlugins = BdsServerPlugins;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Plugin Maneger");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Token Maneger");
const TokenManeger = require("./lib/Token");
module.exports.TokenManeger = TokenManeger;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Token Maneger");


