const { release } = require("os");
const { readdirSync } = require("fs");
const { execSync } = require("child_process");
const commadExist = require("./commandExist");
const Request = require("./Requests");
const bds = require("../index");
const { PlatformVersionsV2 } = require("../src/BdsServersDownload");

async function CheckSystemAsync() {
    const
        PHPBin = await Request.JSON("https://raw.githubusercontent.com/The-Bds-Maneger/Php_Static_Binary/main/binarys.json"),
        Servers = {
            bedrock: await PlatformVersionsV2("bedrock"),
            spigot: await PlatformVersionsV2("spigot"),
            dragonfly: await PlatformVersionsV2("dragonfly"),
        }

    let system, require_qemu = false;
    const valid_platform = {
        bedrock: true,
        pocketmine: true,
        java: commadExist("java"),
        dragonfly: true
    };

    // check php bin
    if ((PHPBin[process.platform] || {})[arch]) valid_platform["pocketmine"] = true;
    else valid_platform["pocketmine"] = false;

    // Check for Dragonfly
    if (!(Servers.dragonfly.versions[Servers.dragonfly.latest][process.platform][bds.arch])) valid_platform["dragonfly"] = false;

    // SoSystem X
    if (process.platform == "win32") {
        system = "Windows";
    } else if (process.platform == "linux") {
        system = "Linux";

        // Bedrock Check
        if (Servers.bedrock.versions[Servers.bedrock.latest][process.platform]) {
            if (Servers.bedrock.versions[Servers.bedrock.latest][process.platform][arch]) valid_platform["bedrock"] = true;
            else valid_platform["bedrock"] = false;
        } else valid_platform["bedrock"] = false;

        if (valid_platform["bedrock"] === false) {
            if (commadExist("qemu-x86_64-static")) {
                // console.warn("The Minecraft Bedrock Server is only being validated because you can use 'qemu-x86_64-static'");;
                valid_platform["bedrock"] = true
                require_qemu = true;
            }
        }
    } else if (process.platform == "darwin") {
        system = "MacOS";
    } else if (process.platform === "android") {
        system = "Android";
        if (valid_platform["bedrock"]) valid_platform["bedrock"] = false;
    } else {
        throw new Error(`The Bds Maneger Core does not support ${process.platform} systems, as no tests have been done.`);
    }

    return {
        system: system,
        require_qemu: require_qemu,
        valid_platform: valid_platform,
    };
}

module.exports = CheckSystemAsync;
module.exports.CheckSystemAsync = CheckSystemAsync;

// System Architect (x64, aarch64 and others)
let arch;
if (process.arch === "arm64") arch = "aarch64";
else arch = process.arch
module.exports.arch = arch

/**
 * Platforms valid from deferents systems
 */
function GetKernel() {
    if (process.platform === "win32") {
        const kernelVersion = parseFloat(release());
        if (kernelVersion <= 6.1) return "Windows 7";
        else if (kernelVersion <= 6.2) return "Windows 8";
        else if (kernelVersion <= 6.3) return "Windows 8.1";
        else if (kernelVersion <= 10.0) return "Windows 10 or Windows 11";
        else return "Other Windows";
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
module.exports.GetKernel = GetKernel;

// Get CPU Core Count
function GetCpuCoreCount() {
    if (process.platform === "win32") return require("os").cpus().length;
    else if (process.platform === "android" || process.platform === "linux") return readdirSync("/sys/devices/system/cpu/").filter(data => /cpu[0-9]/.test(data)).length;
    else if (process.platform === "darwin") return require("os").cpus().length;
    else return 1;
}
module.exports.GetCpuCoreCount = GetCpuCoreCount;
