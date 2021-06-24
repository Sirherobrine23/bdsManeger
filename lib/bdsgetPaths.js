/* eslint-disable no-irregular-whitespace */
const path = require("path")
const { resolve } = path;
const { getDesktopFolder } = require("./GetPlatformFolder");

const desktop = getDesktopFolder()
const home = (process.env.BDS_DIR_PATH || require("os").homedir());
const tmp = require("os").tmpdir()
/* ------------------------------------------------------------ Take the variables of different systems ------------------------------------------------------------ */

var bds_core_package = resolve(__dirname, "package.json")
module.exports.package_path = bds_core_package

/**
 * With different languages ​​and systems we want to find the user's desktop for some link in the directory or even a nice shortcut
 */
module.exports.desktop = desktop

/**
 * Temporary system directory
 */
module.exports.tmp_dir = tmp

/**
 * this variable makes available the location of the user profile directory as
 * 
 * Linux: /home/USER/
 * 
 * Windows: C:\\Users\\USER\\
 * 
 * MacOS: /users/USER/
 */
module.exports.home = home