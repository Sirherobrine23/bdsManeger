const commandExistsSync = require("./commandExist");
const { PHPBin, Servers } = require("./ServerURL");
const { arch } = require("../index")
var system,
require_qemu = false,
valid_platform = {
    bedrock: true,
    pocketmine: true,
    java: commandExistsSync("java"),
    jsprismarine: commandExistsSync("node")
}

// check php bin
if (PHPBin[process.platform]) {
    if (PHPBin[process.platform][arch]) valid_platform["pocketmine"] = true; else valid_platform["pocketmine"] = false
} else valid_platform["pocketmine"] = false

// SoSystem X
if (process.platform == "win32") {
    system = "Windows";
    // arm64 and X64
    if (!(arch === "x64" || arch === "aarch64")) valid_platform["bedrock"] = false;
} else if (process.platform == "linux") {
    system = "Linux";
    if (Servers.bedrock[Servers.bedrock_latest][arch]) {
        if (Servers.bedrock[Servers.bedrock_latest][arch][process.platform]) valid_platform["bedrock"] = true; else valid_platform["bedrock"] = false;
    } else valid_platform["bedrock"] = false
    
    if (valid_platform["bedrock"] === false) {
        if (commandExistsSync("qemu-x86_64-static")) {
            console.warn("The Minecraft Bedrock Server is only being validated because you can use 'qemu-x86_64-static'");
            valid_platform["bedrock"] = true
            require_qemu = true
        }
    }
} else if (process.platform == "darwin") {
    if (arch === "arm64") require("open")("https://github.com/The-Bds-Maneger/core/wiki/system_support#information-for-users-of-macbooks-and-imacs-with-m1-processor")
    else require("open")("https://github.com/The-Bds-Maneger/core/wiki/system_support#macos-with-intel-processors");
    system = "MacOS";
    valid_platform["bedrock"] = false
} else if (process.platform === "android") {
    system = "Android";
    valid_platform["bedrock"] = false
    valid_platform["java"] = false
} else {
    console.log(`The Bds Maneger Core does not support ${process.platform} systems, as no tests have been done.`);
    system = "Other";
    valid_platform["bedrock"] = false
    valid_platform["pocketmine"] = false
    process.exit(254)
}
/* ------------------------------------------------------------ Take the variables of different systems ------------------------------------------------------------ */

/**
 * Platforms valid from deferents systems
 */
module.exports.valid_platform = valid_platform
module.exports.require_qemu = require_qemu
module.exports.system = system