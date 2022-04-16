// import
import StartServer, * as Server from "./server";
import CreateBackup, * as Backup from "./backup";
import DownloadServer, * as downloadServer from "./download_server";
import * as serverConfig from "./serverConfig";
import * as bdsTypes from "./globalType";
// exports
export default {StartServer, CreateBackup, DownloadServer};
export {Server, Backup, downloadServer, serverConfig, bdsTypes};