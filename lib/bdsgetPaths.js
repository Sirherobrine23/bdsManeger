/* eslint-disable no-irregular-whitespace */
const path = require("path")
const { resolve } = path;

const home = (process.env.BDS_DIR_PATH || require("os").homedir());
const tmp = require("os").tmpdir()
/* ------------------------------------------------------------ Take the variables of different systems ------------------------------------------------------------ */
module.exports.package_path = resolve(__dirname, "package.json")

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