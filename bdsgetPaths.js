/* eslint-disable no-irregular-whitespace */
const path = require("path")
const { resolve, join } = path;
const fs = require("fs");
const { getDesktopFolder } = require("./GetPlatformFolder")

const desktop = getDesktopFolder()
const home = require("os").homedir()
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

// save bds core files
const bds_dir = join(home, "bds_core");
/**
 * The most important directory of this project, here are saved some important things like:
 * 
 * The server software
 * 
 * configuration of the Bds Manager API
 * 
 * Backups etc ...
 */
module.exports.bds_dir = bds_dir

// Bds Backups Folder
const bds_dir_backup = path.join(bds_dir, "backups");
module.exports.backup_folder = bds_dir_backup

const log_dir = path.join(bds_dir, "log");
module.exports.log_dir = log_dir

const bds_dir_bedrock = path.join(bds_dir, "bedrock");
module.exports.bds_dir_bedrock = bds_dir_bedrock

const bds_dir_java = path.join(bds_dir, "java");
module.exports.bds_dir_java = bds_dir_java

const bds_dir_pocketmine = path.join(bds_dir, "pocketmine");
module.exports.bds_dir_pocketmine = bds_dir_pocketmine

const bds_dir_jsprismarine = path.join(bds_dir, "jsprismarine");
module.exports.bds_dir_jsprismarine = bds_dir_jsprismarine

// Move old configs to new folder
const old_bds_dir = resolve(home, "bds_Server");
if (fs.existsSync(old_bds_dir)){
    if (fs.existsSync(bds_dir)) {
        fs.renameSync(old_bds_dir, `${old_bds_dir}_Conflit_${Math.trunc(Math.abs(Math.random()) * 10000 * Math.random())}`);
        throw Error("Conflit folders check home dir")
    } else {
        console.log("Moving the old files to the new folder");
        fs.renameSync(old_bds_dir, bds_dir);
    }
}

// Create Main save files
if (!(fs.existsSync(bds_dir))){
    console.log("Creating the bds directory")
    fs.mkdirSync(bds_dir, {recursive: true})
}

// Servers Paths
/* Bedrock Path */
if (!(fs.existsSync(bds_dir_bedrock))){
    console.log("Creating the bds directory to Bedrock")
    fs.mkdirSync(bds_dir_bedrock, {recursive: true})
}

/* Java Path */
if (!(fs.existsSync(bds_dir_java))){
    console.log("Creating the bds directory to Java")
    fs.mkdirSync(bds_dir_java, {recursive: true})
}

/* PocketMine Path */
if (!(fs.existsSync(bds_dir_pocketmine))){
    console.log("Creating the bds directory to Pocketmine")
    fs.mkdirSync(bds_dir_pocketmine, {recursive: true})
}

/* JSPrismarine Path */
if (!(fs.existsSync(bds_dir_jsprismarine))){
    console.log("Creating the bds directory to JSPrismarine")
    fs.mkdirSync(bds_dir_jsprismarine, {recursive: true})
}

// Create backup folder
if (!(fs.existsSync(bds_dir_backup))){
    fs.mkdirSync(bds_dir_backup, {recursive: true})
}

// Link Bds Dir in Desktop
const BdsCoreInDesktop = resolve(desktop, `Bds Maneger Core${(function (){if (process.platform === "win32") return ".lnk";else return "";})()}`)
if (!(fs.existsSync(BdsCoreInDesktop))) {
    console.log("Creating a Bds Core shortcut on the Desktop")
    if (process.platform === "win32") require("create-desktop-shortcuts")({
        windows: {
            filePath: bds_dir,
            name: "Bds Maneger Core"
        }
    });
    else fs.symlinkSync(bds_dir, BdsCoreInDesktop)
}

// Log Dir
if (!(fs.existsSync(log_dir))){
    console.log(`Creating the bds log dir (${log_dir})`)
    fs.mkdirSync(log_dir, {recursive: true})
}
