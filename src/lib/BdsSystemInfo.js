const child_process = require("child_process");
const os = require("os");
const fs = require("fs");
const Request = require("./Requests");
const BdsCoreUrlManeger = require("@the-bds-maneger/server_versions");
const commadExist = require("./commandExist");

// System Architect (x64, aarch64 and others)
let arch = process.arch;
if (process.arch === "arm64") arch = "aarch64";

// Get System Basic Info
async function CheckSystemAsync() {
  const PHPBin = await Request.JSON("https://raw.githubusercontent.com/The-Bds-Maneger/Php_Static_Binary/main/binarys.json");
  const ServerVersions = await BdsCoreUrlManeger.listAsync();
  const Servers = {
    bedrock: ServerVersions.platform.filter(data => data.name === "bedrock")[0].data,
    spigot: ServerVersions.platform.filter(data => data.name === "spigot")[0].data,
    dragonfly: ServerVersions.platform.filter(data => data.name === "dragonfly")[0].data,
  }
  const BasicConfigJSON = {
    require_qemu: false,
    valid_platform: {
      bedrock: true,
      pocketmine: true,
      java: await commadExist.commdExistAsync("java"),
      dragonfly: true
    }
  }

  // check php bin
  if (!((PHPBin[process.platform] || {})[arch])) BasicConfigJSON.valid_platform["pocketmine"] = false;

  // Check for Dragonfly
  if (!(Servers.dragonfly[process.platform][arch])) BasicConfigJSON.valid_platform["dragonfly"] = false;

  // SoSystem X
  if (process.platform == "linux") {
    // Bedrock Check
    if (Servers.bedrock[process.platform]) {
      if (Servers.bedrock[process.platform][arch]) BasicConfigJSON.valid_platform["bedrock"] = true;
      else BasicConfigJSON.valid_platform["bedrock"] = false;
    } else BasicConfigJSON.valid_platform["bedrock"] = false;

    if (BasicConfigJSON.valid_platform["bedrock"] === false) {
      if (await commadExist.commdExistAsync("qemu-x86_64-static")) {
        // console.warn("The Minecraft Bedrock Server is only being validated because you can use 'qemu-x86_64-static'");;
        BasicConfigJSON.valid_platform["bedrock"] = true
        BasicConfigJSON.require_qemu = true;
      }
    }
  } else if (process.platform === "android") {
    if (BasicConfigJSON.valid_platform["bedrock"]) BasicConfigJSON.valid_platform["bedrock"] = false;
  }

  return BasicConfigJSON;
}

/**
 * Platforms valid from deferents systems
 */
function GetKernel() {
  if (process.platform === "win32") {
    const kernelVersion = parseFloat(os.release());
    if (kernelVersion <= 6.1) return "Windows 7";
    else if (kernelVersion <= 6.2) return "Windows 8";
    else if (kernelVersion <= 6.3) return "Windows 8.1";
    else if (kernelVersion <= 10.0) return "Windows 10 or Windows 11";
    else return "Other Windows";
  } else if (process.platform === "android") return `Android: ${os.release()}, CPU Core ${fs.readdirSync("/sys/devices/system/cpu/").filter(data => /cpu[0-9]/.test(data)).length}`;
  else if (commadExist.commdExistSync("uname")) {
    const UnameRV = child_process.execSync("uname -rv").toString("ascii");
    // Amazon web services
    if (/aws/.test(UnameRV)) {
      if (/arm64|aarch64/.test(process.arch)) return "Amazon AWS Cloud arm64: AWS Graviton Serie";
      else return `Amazon AWS Cloud ${process.arch}: ${os.cpus()[0].model}`;
    }

    // Windows subsystem for Linux
    else if (/WSL2|microsft/.test(UnameRV)) return "Microsoft WSL";

    // Azure Virtual Machinime (VM)
    else if (/[aA]zure/.test(UnameRV)) return "Microsoft Azure";

    // Google Cloud Virtual Machinime (VM)
    else if (/[gG]cp/.test(UnameRV)) return "Google Cloud Platform";

    // Oracle cloud Virtual Machinime (VM)
    else if (/[oO]racle/.test(UnameRV)) return "Oracle Cloud infrastructure";

    // Darwin
    else if (/[dD]arwin/.test(UnameRV)) return "Apple MacOS";

    // Others Kernels
    else return UnameRV.replace(/\n|\t|\r/gi, "");
  } else return "Not identified";
}

/**
 * Get CPU Cores number
 */
function GetCpuCoreCount() {
  if (process.platform === "android") return fs.readdirSync("/sys/devices/system/cpu/").filter(data => /cpu[0-9]/.test(data)).length;
  else return os.cpus().length;
}

module.exports = CheckSystemAsync;
module.exports.SystemInfo = CheckSystemAsync;
module.exports.GetKernel = GetKernel;
module.exports.CheckSystemAsync = CheckSystemAsync;
module.exports.GetCpuCoreCount = GetCpuCoreCount;
module.exports.arch = arch;
