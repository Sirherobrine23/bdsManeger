const { execSync } = require("child_process");
const { release } = require("os");
const { readdirSync } = require("fs");
const commadExist = require("./commandExist");
const fetchSync = require("@the-bds-maneger/fetchsync");

// Load JSON for Server and PHP Zip files
const PHPBin = fetchSync("https://raw.githubusercontent.com/The-Bds-Maneger/Php_Static_Binary/main/binarys.json").json(),
    Servers = fetchSync("https://raw.githubusercontent.com/The-Bds-Maneger/external_files/main/Server.json").json();

// System Architect (x64, aarch64 and others)
var arch;
if (process.arch === "arm64") arch = "aarch64";
else arch = process.arch
module.exports.arch = arch

var system,
    require_qemu = false,
    valid_platform = {
        bedrock: true,
        pocketmine: true,
        java: commadExist("java"),
        dragonfly: commadExist("go"),
    }

// check php bin
if ((PHPBin[process.platform] || {})[arch]) valid_platform["pocketmine"] = true;
    else valid_platform["pocketmine"] = false;

// SoSystem X
if (process.platform == "win32") {
    system = "Windows";
} else if (process.platform == "linux") {
    system = "Linux";
    
    // Bedrock Check
    if (Servers.bedrock[Servers.latest.bedrock][arch]) {
        if (Servers.bedrock[Servers.latest.bedrock][arch][process.platform]) valid_platform["bedrock"] = true;
        else valid_platform["bedrock"] = false;
    } else valid_platform["bedrock"] = false;

    if (valid_platform["bedrock"] === false) {
        if (commadExist("qemu-x86_64-static")) {
            console.warn("The Minecraft Bedrock Server is only being validated because you can use 'qemu-x86_64-static'");
            valid_platform["bedrock"] = true
            require_qemu = true
        }
    }
} else if (process.platform == "darwin") {
    system = "MacOS";
    valid_platform["bedrock"] = false
} else if (process.platform === "android") {
    system = "Android";
    valid_platform["bedrock"] = false
} else {
    console.log(`The Bds Maneger Core does not support ${process.platform} systems, as no tests have been done.`);
    process.exit(127);
}

function GetKernel() {
    if (process.platform === "win32") {
        const kernelVersion = parseFloat(release());
        if (kernelVersion <= 6.1) return "Windows 7";
        else if (kernelVersion <= 6.2) return "Windows 8";
        else if (kernelVersion <= 6.3) return "Windows 8.1";
        else if (kernelVersion <= 10.0) return "Windows 10";
        else return "Other Windows or Windows 11";
    } else if (process.platform === "android") return `Android: ${release()}, CPU Core ${readdirSync("/sys/devices/system/cpu/").filter(data => /cpu[0-9]/.test(data)).length}`;
    else if (commadExist("uname")) {
        const str = execSync("uname -rv").toString("ascii");
        // Amazon web services
        if (/aws/.test(str)) {
            if (/arm64|aarch64/.test(process.arch)) return "Amazon AWS Cloud arm64: AWS Graviton Serie";
            else return `Amazon AWS Cloud ${process.arch}: ${require("os").cpus()[0].model}`;
        }

        // Windows subsystem for Linux
        else if (/WSL2|microsft/.test(str)) return "Microsoft WSL";

        // Azure Virtual Machinime (VM)
        else if (/[aA]zure/.test(str)) return "Microsoft Azure";

        // Google Cloud Virtual Machinime (VM)
        else if (/[gG]cp/.test(str)) return "Google Cloud Platform";

        // Oracle cloud Virtual Machinime (VM)
        else if (/[oO]racle/.test(str)) return "Oracle Cloud infrastructure";

        // Darwin
        else if (/[dD]arwin/.test(str)) return "Apple MacOS";

        // Others Kernels
        else return str.replace(/\n|\t|\r/gi, "");
    } else return "Not identified";
}

/**
 * Platforms valid from deferents systems
 */
module.exports.valid_platform = valid_platform
module.exports.require_qemu = require_qemu
module.exports.system = system
module.exports.GetKernel = GetKernel;
