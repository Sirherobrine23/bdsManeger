// Utils
import * as platformPathManeger from "./platformPathManeger.js"
import * as globalPlatfroms from "./globalPlatfroms.js";
import * as pluginManeger from "./plugin/plugin.js";
import * as export_import from "./export_import.js";
import * as pluginHooks from "./plugin/hook.js";
import * as proxy from "./lib/proxy.js";

// Platforms
import * as Bedrock from "./Platforms/bedrock.js";
import * as Java from "./Platforms/java.js";
import * as PocketmineMP from "./Platforms/pocketmine.js";
import * as Spigot from "./Platforms/spigot.js";
import * as Powernukkit from "./Platforms/pwnuukit.js";
import * as PaperMC from "./Platforms/paper.js";

export {platformPathManeger, globalPlatfroms, pluginManeger, export_import, PocketmineMP, pluginHooks, Powernukkit, PaperMC, Bedrock, Spigot, proxy, Java};
export default {
  Bedrock,
  Java,
  PocketmineMP,
  Powernukkit,
  PaperMC,
  Spigot,
  utils: {
    platformPathManeger,
    globalPlatfroms,
    pluginManeger,
    pluginHooks,
    export_import,
    proxy
  }
};
