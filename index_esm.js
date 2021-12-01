// Mount Module Oject
const ModuleExport = {}
import package_json from "./package.json";
import BdsManegerInfo from "./src/BdsManegerInfo.json";

const BdsManegerCoreJSONs = {
  Package: package_json,
  Extra: BdsManegerInfo
};

ModuleExport.version = package_json.version;
ModuleExport.ExtraJSON = BdsManegerCoreJSONs;

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Settings");
import BdsSettings from "./esm/lib/BdsSettings";
ModuleExport.BdsSettings = BdsSettings;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Token");
import BdsToken from "./esm/lib/Token";
ModuleExport.BdsToken = BdsToken;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Token");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: System Info");
import BdsSystemInfo from "./esm/lib/BdsSystemInfo";
ModuleExport.BdsSystemInfo = BdsSystemInfo;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: System Info");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Network");
import BdsNetwork from "./esm/lib/BdsNetwork";
ModuleExport.BdsNetwork = BdsNetwork;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Network");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Backups");
import BdsBackup from "./esm/BdsBackup";
ModuleExport.BdsBackup = BdsBackup;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Backups");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Settings");
import BdsServerSettings from "./esm/BdsServerSettings";
ModuleExport.BdsServerSettings = BdsServerSettings;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Settings");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Download Server");
import BdsDownload from "./esm/BdsDownload";
ModuleExport.BdsDownload = BdsDownload;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Download Server");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Check And Kill");
import BdsCkeckKill from "./esm/BdsCkeckKill";
ModuleExport.BdsCkeckKill = BdsCkeckKill;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Check And Kill");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: API");
import BdsManegerAPI from "./esm/api";
ModuleExport.BdsManegerAPI = BdsManegerAPI;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: API");

if (process.env.ShowLoadTime) console.time("Bds Maneger Core: Server Maneger");
import BdsManegerServer from "./esm/BdsManegerServer";
ModuleExport.BdsManegerServer = BdsManegerServer;
if (process.env.ShowLoadTime) console.timeEnd("Bds Maneger Core: Server Maneger");
if (process.env.ShowLoadTime) console.log("Bds Maneger Core: Complete");

export default ModuleExport;
