const fs = require("fs");
const path = require("path");
const { writeFileSync, existsSync, readFileSync, readdirSync, rmSync } = fs;
const { join, resolve } = path;
var AdmZip = require("adm-zip");
const { GetServerPaths, GetPlatform } = require("../src/lib/BdsSettings");
const Extra = require("./BdsManegerInfo.json");
const bds = require("../index");
const Request = require("../src/lib/Requests");

// Get Platform Object Versions
async function PlatformVersionsV2(SelectPlatform = "") {
  const CurrentPlatform = SelectPlatform || GetPlatform();
  let ResToRetuen = {
    latest: "",
    versions: {
      "123.123.123": {
        data: `${new Date()}`,
        url: "",
        linux: {
          aarch64: "",
          armv7: "",
          x64: "",
          i386: ""
        },
        win32: {
          aarch64: "",
          x64: "",
          i386: ""
        },
        darwin: {
          aarch64: "",
          x64: ""
        },
        android: {
          aarch64: "",
          x64: ""
        }
      }
    }
  }
  // lgtm [js/useless-assignment-to-local]
  ResToRetuen = await Request.json(`https://raw.githubusercontent.com/The-Bds-Maneger/ServerVersions/main/${CurrentPlatform}/server.json`);
  return ResToRetuen;
}

// Php download and install
async function php_download() {
  const bds_dir_pocketmine = GetServerPaths("pocketmine");
  const PHPBin = (await (await fetch(Extra.Fetchs.php)).json());
  const phpFolder = resolve(bds_dir_pocketmine, "bin");
  const phpExtensiosnsDir = resolve(bds_dir_pocketmine, "bin/php7/lib/php/extensions");
  
  // Check Php Binary
  let urlPHPBin = PHPBin[process.platform]
  if (!(urlPHPBin)) throw new Error("unsupported system")
  urlPHPBin = urlPHPBin[bds.BdsSystemInfo.arch];
  if (!(urlPHPBin)) throw new Error("unsupported arch")

  // Remove Old php Binary if it exists
  if (existsSync(phpFolder)) {
    rmSync(phpFolder, { recursive: true });
  }
  const ZipBuffer = Buffer.from((await (await fetch(urlPHPBin)).arrayBuffer()));
  const zipExtractBin = new AdmZip(ZipBuffer);
  zipExtractBin.extractAllTo(bds_dir_pocketmine, false)

  if (process.platform === "win32") return resolve();

  let phpConfigInit = readFileSync(join(phpFolder, "php7", "bin", "php.ini"), "utf8");
  if (!(existsSync(phpExtensiosnsDir))) return true;

  const phpExtensiosns = readdirSync(phpExtensiosnsDir).map(FileFolder => {
    if (!(FileFolder.includes("debug-zts"))) return false;
    return resolve(phpExtensiosnsDir, FileFolder);
  }).filter(a=>a);

  if (phpConfigInit.includes("extension_dir")) console.log("Skipping php.ini configuration");
  else {
    phpConfigInit = (`extension_dir="${phpExtensiosns.join()}"\n${phpConfigInit}`);
    writeFileSync(join(phpFolder, "php7", "bin", "php.ini"), phpConfigInit);
  }
  return true;
}

// New Download Method
async function BdsDownloadV2(version = "latest") {
  const CurrentPlatform = GetPlatform();
  const { valid_platform, require_qemu } = await (require("../src/lib/BdsSystemInfo")).CheckSystemAsync();
  const LocalServersVersions = bds.BdsSettings.GetServerVersion();
  const { ServersPaths } = bds.BdsSettings;

  const ReturnObject = {
    version: version,
    platform: CurrentPlatform,
    url: "",
    data: new Date(),
    skip: false
  };

  // Bedrock
  if (CurrentPlatform === "bedrock") {
    const BedrockVersions = await PlatformVersionsV2("bedrock");
    if (/true|false|null|undefined|latest/.test(`${version}`.toLocaleLowerCase())) {
      version = BedrockVersions.latest;
      ReturnObject.version = version;
    }
    if (valid_platform.bedrock) {
      if (LocalServersVersions.bedrock !== version) {
        // Add info to ReturnObject
        if (require_qemu) ReturnObject.url = BedrockVersions.versions[version][process.platform]["x64"];
        else ReturnObject.url = BedrockVersions.versions[version][process.platform][bds.BdsSystemInfo.arch];
        ReturnObject.data = BedrockVersions.versions[version].data ? new Date(BedrockVersions.versions[version].data) : null;

        // Download and Add buffer to AdmZip
        const BedrockZip = new AdmZip(await Request.buffer(ReturnObject.url));

        // Create Backup Bedrock Config
        const BedrockConfigFiles = {
          proprieties: "",
          whitelist: "",
          permissions: "",
        };

        // Get Bedrock Config Files
        if (fs.existsSync(path.join(ServersPaths.bedrock, "bedrock_server.properties"))) BedrockConfigFiles.proprieties = fs.readFileSync(path.join(ServersPaths.bedrock, "bedrock_server.properties"), "utf8");
        if (fs.existsSync(path.join(ServersPaths.bedrock, "whitelist.json"))) BedrockConfigFiles.whitelist = fs.readFileSync(path.join(ServersPaths.bedrock, "whitelist.json"), "utf8");
        if (fs.existsSync(path.join(ServersPaths.bedrock, "permissions.json"))) BedrockConfigFiles.permissions = fs.readFileSync(path.join(ServersPaths.bedrock, "permissions.json"), "utf8");

        // Extract to Bedrock Dir
        BedrockZip.extractAllTo(ServersPaths.bedrock, true);

        // Write Bedrock Config Files
        if (BedrockConfigFiles.proprieties) fs.writeFileSync(path.join(ServersPaths.bedrock, "bedrock_server.properties"), BedrockConfigFiles.proprieties, "utf8");
        if (BedrockConfigFiles.whitelist) fs.writeFileSync(path.join(ServersPaths.bedrock, "whitelist.json"), BedrockConfigFiles.whitelist, "utf8");
        if (BedrockConfigFiles.permissions) fs.writeFileSync(path.join(ServersPaths.bedrock, "permissions.json"), BedrockConfigFiles.permissions, "utf8");

        // Update Server Version
        bds.BdsSettings.UpdateServerVersion(version, CurrentPlatform);
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Bedrock not suported");
    }
  }

  // Java
  else if (CurrentPlatform === "java") {
    const JavaVersions = await PlatformVersionsV2("java");
    if (typeof version === "boolean" || /true|false|null|undefined|latest/.test(`${version}`.toLocaleLowerCase())) version = JavaVersions.latest;
    if (valid_platform.java) {
      if (LocalServersVersions.java !== version) {
        // Add info to ReturnObject
        ReturnObject.url = JavaVersions.versions[version].url;
        ReturnObject.data = JavaVersions.versions[version].data;

        // Download and write java file
        const JavaBufferJar = await Request.buffer(ReturnObject.url);
        fs.writeFileSync(path.join(ServersPaths.java, "MinecraftServerJava.jar"), JavaBufferJar, "binary");

        // Write EULA
        fs.writeFileSync(path.join(ServersPaths.java, "eula.txt"), "eula=true");

        // Update Server Version
        bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Java not suported");
    }
  }

  // Spigot
  else if (CurrentPlatform === "spigot") {
    const SpigotVersions = await PlatformVersionsV2("spigot");
    if (typeof version === "boolean" || /true|false|null|undefined|latest/.test(`${version}`.toLocaleLowerCase())) version = SpigotVersions.latest;
    if (valid_platform.spigot) {
      if (LocalServersVersions.spigot !== version) {
        // Add info to ReturnObject
        ReturnObject.url = SpigotVersions.versions[version].url;
        ReturnObject.data = SpigotVersions.versions[version].data;

        // Download and write java file
        fs.writeFileSync(path.join(ServersPaths.spigot, "spigot.jar"), await Request.buffer(ReturnObject.url), "binary");

        // Update Server Version
        bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Spigot not suported");
    }
  }

  // Dragonfly
  else if (CurrentPlatform === "dragonfly") {
    const DragonflyVersions = await PlatformVersionsV2("dragonfly");
    if (typeof version === "boolean" || /true|false|null|undefined|latest/.test(`${version}`.toLocaleLowerCase())) version = DragonflyVersions.latest;
    if (valid_platform.dragonfly) {
      if (LocalServersVersions.dragonfly !== version) {
        // Add info to ReturnObject
        ReturnObject.url = DragonflyVersions.versions[version][process.platform][bds.BdsSystemInfo.arch];
        ReturnObject.data = DragonflyVersions.versions[version].data;

        // Download
        let DgBin = path.join(ServersPaths.dragonfly, "Dragonfly");
        if (process.platform === "win32") DgBin += ".exe";
        fs.writeFileSync(DgBin, await Request.buffer(ReturnObject.url), "binary");

        // Update Server Version
        bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Dragonfly not suported");
    }
  }

  // Pocketmine-MP
  else if (CurrentPlatform === "pocketmine") {
    const PocketmineVersions = await PlatformVersionsV2("pocketmine");
    if (typeof version === "boolean" || /true|false|null|undefined|latest/.test(`${version}`.toLocaleLowerCase())) version = PocketmineVersions.latest;
    if (valid_platform.pocketmine) {
      if (LocalServersVersions.pocketmine !== version) {
        // Add info to ReturnObject
        ReturnObject.url = PocketmineVersions.versions[version].url;
        ReturnObject.data = PocketmineVersions.versions[version].data;

        // Download PHP Bin
        await php_download();

        // Download php file and save
        const PocketmineBufferPhp = await Request.buffer(ReturnObject.url);
        fs.writeFileSync(path.join(ServersPaths.pocketmine, "PocketMine-MP.phar"), PocketmineBufferPhp, "binary");

        // Update Server Version
        bds.BdsSettigs.UpdateServerVersion(version, CurrentPlatform);
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Pocketmine-MP not suported");
    }
  }

  // if the platform does not exist
  else throw Error("No Valid Platform");

  // Return info download
  return ReturnObject;
}

// Export
module.exports = BdsDownloadV2;
module.exports.v2 = BdsDownloadV2;
module.exports.PlatformVersionsV2 = PlatformVersionsV2;