const child_process = require("child_process");
const os = require("os");
const fs = require("fs");
const Request = require("./Requests");
const BdsCoreUrlManeger = require("@the-bds-maneger/server_versions");
const commadExist = require("./commandExist");

// System Architect (x64, aarch64 and others)
let arch = process.arch;
if (process.arch === "arm64") arch = "aarch64";
module.exports.arch = arch;

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
module.exports = CheckSystemAsync;
module.exports.SystemInfo = CheckSystemAsync;
module.exports.CheckSystemAsync = CheckSystemAsync;

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
module.exports.GetKernel = GetKernel;

/**
 * Get CPU Cores number
 */
function GetCpuCoreCount() {
  if (process.platform === "android") return fs.readdirSync("/sys/devices/system/cpu/").filter(data => /cpu[0-9]/.test(data)).length;
  else return os.cpus().length;
}
module.exports.GetCpuCoreCount = GetCpuCoreCount;

/**
 * Advanced System And Server Infomaion
 * 
 * @return {{
 *  platform: NodeJS.Platform;
 *  arch: string;
 *  kernel: string;
 *  cpu_cores: number;
 *  RequiredQemu: boolean;
 *  RunningOn: "native"|"emulated"|"unknown";
 *  AvaibleServers: {
 *     bedrock: {
 *       avaible: boolean;
 *       RequiredQemu: boolean;
 *       RunningOn: "native"|"emulated";
 *     };
 *     spigot: {
 *       avaible: boolean;
 *       RequiredQemu: boolean;
 *       RunningOn: "native"|"emulated";
 *     };
 *     dragonfly: {
 *       avaible: boolean;
 *       RequiredQemu: boolean;
 *       RunningOn: "native"|"emulated";
 *     };
 *     pocketmine: {
 *       avaible: boolean;
 *       RequiredQemu: boolean;
 *       RunningOn: "native"|"emulated";
 *     };
 *   };
 * }}
 */
async function AdvancedInfo() {
  const Info = {
    platform: process.platform,
    arch: arch,
    kernel: GetKernel(),
    cpu_cores: GetCpuCoreCount(),
    AvaibleQemu: false,
    AvaibleServers: {
      bedrock: {
        avaible: false,
        RequiredQemu: false,
        RunningOn: "native",
        arch: arch
      },
      spigot: {
        avaible: false,
        RequiredQemu: false,
        RunningOn: "native",
        arch: arch
      },
      java: {
        avaible: false,
        RequiredQemu: false,
        RunningOn: "native",
        arch: arch
      },
      dragonfly: {
        avaible: false,
        RequiredQemu: false,
        RunningOn: "native",
        arch: arch
      },
      pocketmine: {
        avaible: false,
        RequiredQemu: false,
        RunningOn: "native",
        arch: arch
      },
    }
  }

  if (process.platform === "linux") Info.AvaibleQemu = await commadExist.commdExistAsync("qemu-x86_64-static");
  else if (process.platform === "android") Info.AvaibleQemu = await commadExist.commdExistAsync("qemu-x86_64");

  // PHP Static bins
  const PhpBinFiles = await Request.GetLatestReleaseFromGithub("The-Bds-Maneger/PocketMinePHPAutoBinBuilds");
  if (PhpBinFiles.assets.find(data => {
    let Status = true;
    if (process.platform === "win32") Status = data.name.includes("Windows");
    else if (process.platform === "linux") Status = data.name.includes("Linux");
    else if (process.platform === "darwin") Status = data.name.includes("MacOS");
    else if (process.platform === "android") Status = data.name.includes("Android");
    if (arch === "x64") Status = data.name.includes("x64");
    else if (arch === "x32") Status = data.name.includes("x32");
    else if (arch === "arm64") Status = data.name.includes("aarch64");
    return Status;
  })) Info.AvaibleServers.pocketmine.avaible = true;

  const Versions = await BdsCoreUrlManeger.listAsync();
  const Bedrock = Versions.platform.filter(Data => Data.name === "bedrock");
  const Dragonfly = Versions.platform.filter(Data => Data.name === "dragonfly");
  
  // Bedrock
  if (Bedrock.find(Data => Data.version === Versions.latest.bedrock).data[process.platform][arch]) Info.AvaibleServers.bedrock.avaible = true;
  else {
    if (Info.AvaibleQemu) {
      Info.AvaibleServers.bedrock.RequiredQemu = true;
      Info.AvaibleServers.bedrock.RunningOn = "emulated";
      Info.AvaibleServers.bedrock.arch = "x64";
    }
  }

  // Dragonfly
  if (Dragonfly.find(Data => Data.version === Versions.latest.dragonfly).data[process.platform][arch]) Info.AvaibleServers.dragonfly.avaible = true;
  else {
    if (Info.AvaibleQemu) {
      Info.AvaibleServers.dragonfly.RequiredQemu = true;
      Info.AvaibleServers.dragonfly.RunningOn = "emulated";
      Info.AvaibleServers.dragonfly.arch = "x64";
    }
  }

  // Java
  if (await commadExist.commdExistAsync("java")) {
    let JavaVersion = "";
    // OpenJDK
    try {
      const Javave = child_process.execFileSync("java", ["-version"]).toString();
      if (Javave.includes("openjdk")) {
        JavaVersion = Javave.match(/openjdk version "(.*)"/)[0];
      } else {
        JavaVersion = Javave.match(/java version "(.*)"/)[0];
      }
    } catch (err) {
      JavaVersion = "Not found";
    }
    // Java
    try {
      const Javave = child_process.execFileSync("java", ["--version"]).toString();
      JavaVersion = Javave.match(/java version "(.*)"/)[0];
    } catch (err) {
      JavaVersion = "Not found";
    }
    console.log(JavaVersion)
    if (!(JavaVersion === "" || JavaVersion === "Not found")) {
      if (parseFloat(JavaVersion) >= 16.0) {
        Info.AvaibleServers.spigot.avaible = true;
        Info.AvaibleServers.java.avaible = true;
      }
    }
  }

  return Info;
}
module.exports.AdvancedInfo = AdvancedInfo;