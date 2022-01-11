/* eslint-disable no-irregular-whitespace */
// process.env.ShowLoadTime = true;
// Load Root JSON
const BdsManegerCoreJSONs = {
  Package: require("../package.json"),
  Extra: require("./BdsManegerInfo.json")
};

// Bds Maneger Core Version
const version = BdsManegerCoreJSONs.Package.version;
const ExtraJSON = BdsManegerCoreJSONs;

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Settings");
const BdsSettings = require("./lib/BdsSettings");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Token");
const BdsToken = require("./lib/Token");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Token");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: System Info");
const BdsSystemInfo = require("./lib/BdsSystemInfo");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: System Info");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Network");
const BdsNetwork = require("./BdsNetwork");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Network");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Backups");
const BdsBackup = require("./BdsBackup");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Backups");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Settings");
const BdsServerSettings = require("./ServerSettings");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Download Server");
const BdsDownload = require("./BdsServersDownload");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Download Server");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Check And Kill");
const BdsCkeckKill = require("./CheckKill");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Check And Kill");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: API");
const BdsManegerAPI = require("./api");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: API");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Maneger");
const BdsManegerServer = require("./ServerManeger");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Maneger");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Plugin Maneger");
const BdsServerPlugins = require("./PluginManeger");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Plugin Maneger");

const TokenManeger = require("./lib/Token");

module.exports = {
  version: version,
  ExtraJSON: ExtraJSON,
  BdsSettings: BdsSettings,
  BdsToken: BdsToken,
  BdsSystemInfo: BdsSystemInfo,
  BdsNetwork: BdsNetwork,
  BdsBackup: BdsBackup,
  BdsServerSettings: BdsServerSettings,
  BdsDownload: BdsDownload,
  BdsCkeckKill: BdsCkeckKill,
  BdsManegerAPI: BdsManegerAPI,
  BdsManegerServer: BdsManegerServer,
  BdsServerPlugins: BdsServerPlugins,
  TokenManeger: TokenManeger
};