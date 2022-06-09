// import All platforms and old functions
// New Methods
import * as platform from "./platform/index";

// Old functions
import * as downloadServer from "./download_server";
import * as worldManeger from "./worldManeger";
import * as serverConfig from "./serverConfig";
import * as bdsTypes from "./globalType";
import * as backup from "./backup/index";
import * as Server from "./server";

// Export all modules
export default {
  bdsTypes,
  platform,
  downloadServer,
  worldManeger,
  serverConfig,
  backup,
  Server,
};