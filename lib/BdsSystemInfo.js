const commadExist = require("./commandExist")
const { execSync } = require("child_process");
const { readdirSync } = require("fs");
const { release } = require("os")

const { PHPBin, Servers } = require("./ServerURL");

// System Architect (x64, aarch64 and others)
var arch;
if (process.arch === "arm64") arch = "aarch64"; else arch = process.arch
module.exports.arch = arch

var system,
require_qemu = false,
valid_platform = {
    bedrock: true,
    pocketmine: true,
    java: commadExist("java"),
    jsprismarine: commadExist("node")
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
        if (commadExist("qemu-x86_64-static")) {
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

function GetKernel() {
    if (process.platform === "win32") {
        const kernelVersion = parseFloat(release());
        if (kernelVersion <= 6.1) return "Windows 7 NT";
        else if (kernelVersion <= 6.2) return "Windows 8 NT";
        else if (kernelVersion <= 6.3) return "Windows 8.1 NT";
        else if (kernelVersion <= 10.0) return "Windows 10 NT";
        else return "Other Windows NT";
    }
    else if (process.platform === "android") return `${release()}, CPU Core ${readdirSync("/sys/devices/system/cpu/").filter(data=>{return /cpu[0-9]/.test(data)}).length}`;
    else if (commadExist("uname")){
        const str = execSync("uname -rv").toString("ascii");
        switch (true) {
            // amazon aws EC2
            case /aws/.test(str):
                if (process.arch === "arm64" || process.arch === "aarch64") return "Amazon AWS Cloud arm64: AWS Graviton";
                else return `Amazon AWS Cloud ${process.arch}: ${require("os").cpus()[0].model}`;

            // Windows WSL 1
            case /microsoft/.test(str):
                return "Microsoft WSL 1";
            // Windows WSL 2
            case /Microsoft/.test(str):
                return "Microsoft WSL 2";

            // Azure Virtual Machinime (VM)
            case /[aA]zure/.test(str):
                return "Microsoft Azure";

            // Google Cloud Virtual Machinime (VM)
            case /[gG]cp/.test(str):
                return "Google Cloud Platform";

            // Oracle cloud Virtual Machinime (VM)
            case /[oO]racle/.test(str):
                return "Oracle Cloud infrastructure";

            // Darwin
            case /[dD]arwin/.test(str):
                return "Apple MacOS";

            // Others Kernels
            default:
                return str.split("\n").join("");
        }
    } else return null;
}

/**
 * Platforms valid from deferents systems
 */
module.exports.valid_platform = valid_platform
module.exports.require_qemu = require_qemu
module.exports.system = system

module.exports.GetKernel = GetKernel;