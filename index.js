/* eslint-disable no-irregular-whitespace */
// process.env.ShowLoadTime = true;
// Load Root JSON
const BdsManegerCoreJSONs = {
  Package: require("./package.json"),
  Extra: require("./BdsManegerInfo.json")
};

// Bds Maneger Core Version
module.exports.version = BdsManegerCoreJSONs.Package.version;
module.exports.ExtraJSON = BdsManegerCoreJSONs;

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Settings");
module.exports.BdsSettings = require("./src/lib/BdsSettings");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: System Info");
module.exports.BdsSystemInfo = require("./src/lib/BdsSystemInfo");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: System Info");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Network");
module.exports.BdsNetwork = require("./src/BdsNetwork");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Network");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Backups");
module.exports.BdsBackup = require("./src/BdsBackup");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Backups");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Settings");
module.exports.BdsServerSettings = require("./src/ServerSettings");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Download Server");
module.exports.BdsDownload = require("./src/BdsServersDownload");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Download Server");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Check And Kill");
module.exports.BdsCkeckKill = require("./src/CheckKill");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Check And Kill");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: API");
module.exports.BdsManegerAPI = require("./src/api");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: API");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Maneger");
module.exports.BdsManegerServer = require("./src/BdsManegerServer");
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Maneger");
if (process.env.ShowLoadTime) console.log("Bds Maneger Core: Complete");