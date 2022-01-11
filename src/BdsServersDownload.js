const fs = require("fs");
const path = require("path");
const Extra = require("./BdsManegerInfo.json");
const bds = require("../src/index");
const Request = require("../src/lib/Requests");
const BdsCoreURlManeger = require("@the-bds-maneger/server_versions");
var AdmZip = require("adm-zip");

// Php download and install
async function php_download() {
  const bds_dir_pocketmine = bds.BdsSettings.GetPaths("pocketmine", true);
  const PHPBin = await Request.json(Extra.Fetchs.php);
  const phpFolder = path.resolve(bds_dir_pocketmine, "bin");

  // Check Php Binary
  let urlPHPBin = PHPBin[process.platform]
  if (!(urlPHPBin)) throw new Error("unsupported system")
  urlPHPBin = urlPHPBin[bds.BdsSystemInfo.arch];
  if (!(urlPHPBin)) throw new Error("unsupported arch")

  // Remove Old php Binary if it exists
  if (fs.existsSync(phpFolder)) {
    fs.rmSync(phpFolder, { recursive: true });
  }

  // Download php binary
  const ZipBuffer = await Request.buffer(urlPHPBin);
  const zipExtractBin = new AdmZip(ZipBuffer);
  zipExtractBin.extractAllTo(bds_dir_pocketmine, false)

  if (process.platform === "win32") return path.resolve();

  let phpConfigInit = fs.readFileSync(path.join(phpFolder, "php7", "bin", "php.ini"), "utf8");
  const phpExtensiosnsDir = path.resolve(bds_dir_pocketmine, "bin/php7/lib/php/extensions");
  if (!(fs.existsSync(phpExtensiosnsDir))) return true;

  const phpExtensiosns = fs.readdirSync(phpExtensiosnsDir).map(FileFolder => {
    if (!(FileFolder.includes("debug-zts"))) return false;
    return path.resolve(phpExtensiosnsDir, FileFolder);
  }).filter(a=>a);

  if (phpConfigInit.includes("extension_dir")) console.log("Skipping php.ini configuration");
  else {
    phpConfigInit = (`extension_dir="${phpExtensiosns.join()}"\n${phpConfigInit}`);
    fs.writeFileSync(path.join(phpFolder, "php7", "bin", "php.ini"), phpConfigInit);
  }
  return true;
}

// New Download Method
async function BdsDownload(version = "latest") {
  const CurrentPlatform = bds.BdsSettings.CurrentPlatorm();
  const { valid_platform } = await (require("../src/lib/BdsSystemInfo")).CheckSystemAsync();
  const LocalServersVersions = bds.BdsSettings.GetBdsConfig().server.versions;
  const { Servers, ServersConfig: SeverPathsConfig } = bds.BdsSettings.GetBdsConfig().paths;
  if (typeof version === "boolean" || /true|false|null|undefined/.test(`${version}`.toLocaleLowerCase())) version = "latest";
  const UrlsInfo = await BdsCoreURlManeger.findAsync(version, CurrentPlatform);

  const ReturnObject = {
    version: UrlsInfo.raw_request.version,
    platform: CurrentPlatform,
    url: UrlsInfo.url,
    data: UrlsInfo.Date,
    skip: false
  };

  // Bedrock
  if (CurrentPlatform === "bedrock") {
    const BedrockServerPath = path.join(Servers, SeverPathsConfig.bedrock);
    if (valid_platform.bedrock) {
      if (LocalServersVersions.bedrock !== version) {
        // Download and Add buffer to AdmZip
        const BedrockZip = new AdmZip(await Request.buffer(ReturnObject.url));

        // Create Backup Bedrock Config
        const BedrockConfigFiles = {
          proprieties: "",
          whitelist: "",
          permissions: "",
        };

        // Get Bedrock Config Files
        if (fs.existsSync(path.join(BedrockServerPath, "bedrock_server.properties"))) BedrockConfigFiles.proprieties = fs.readFileSync(path.join(BedrockServerPath, "bedrock_server.properties"), "utf8");
        if (fs.existsSync(path.join(BedrockServerPath, "whitelist.json"))) BedrockConfigFiles.whitelist = fs.readFileSync(path.join(BedrockServerPath, "whitelist.json"), "utf8");
        if (fs.existsSync(path.join(BedrockServerPath, "permissions.json"))) BedrockConfigFiles.permissions = fs.readFileSync(path.join(BedrockServerPath, "permissions.json"), "utf8");

        // Extract to Bedrock Dir
        BedrockZip.extractAllTo(BedrockServerPath, true);

        // Write Bedrock Config Files
        if (BedrockConfigFiles.proprieties) fs.writeFileSync(path.join(BedrockServerPath, "bedrock_server.properties"), BedrockConfigFiles.proprieties, "utf8");
        if (BedrockConfigFiles.whitelist) fs.writeFileSync(path.join(BedrockServerPath, "whitelist.json"), BedrockConfigFiles.whitelist, "utf8");
        if (BedrockConfigFiles.permissions) fs.writeFileSync(path.join(BedrockServerPath, "permissions.json"), BedrockConfigFiles.permissions, "utf8");
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Bedrock not suported");
    }
  }

  // Java
  else if (CurrentPlatform === "java") {
    const JavaServerPath = path.join(Servers, SeverPathsConfig.java);
    if (valid_platform.java) {
      if (LocalServersVersions.java !== version) {
        // Download and write java file
        const JavaBufferJar = await Request.buffer(ReturnObject.url);
        fs.writeFileSync(path.join(JavaServerPath, "MinecraftServerJava.jar"), JavaBufferJar, "binary");

        // Write EULA
        fs.writeFileSync(path.join(JavaServerPath, "eula.txt"), "eula=true");
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Java not suported");
    }
  }

  // Spigot
  else if (CurrentPlatform === "spigot") {
    const SpigotServerPath = path.join(Servers, SeverPathsConfig.spigot);
    if (valid_platform.spigot) {
      if (LocalServersVersions.spigot !== version) {
        // Download and write java file
        fs.writeFileSync(path.join(SpigotServerPath, "spigot.jar"), await Request.buffer(ReturnObject.url), "binary");
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Spigot not suported");
    }
  }

  // Dragonfly
  else if (CurrentPlatform === "dragonfly") {
    const DragonflyServerPath = path.join(Servers, SeverPathsConfig.dragonfly);
    if (valid_platform.dragonfly) {
      if (LocalServersVersions.dragonfly !== version) {
        // Download
        let DgBin = path.join(DragonflyServerPath, "Dragonfly");
        if (process.platform === "win32") DgBin += ".exe";
        fs.writeFileSync(DgBin, await Request.buffer(ReturnObject.url), "binary");
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Dragonfly not suported");
    }
  }

  // Pocketmine-MP
  else if (CurrentPlatform === "pocketmine") {
    const PocketmineServerPath = path.join(Servers, SeverPathsConfig.pocketmine);
    if (valid_platform.pocketmine) {
      if (LocalServersVersions.pocketmine !== version) {
        // Download PHP Bin
        await php_download();

        // Download php file and save
        const PocketmineBufferPhp = await Request.buffer(ReturnObject.url);
        fs.writeFileSync(path.join(PocketmineServerPath, "PocketMine-MP.phar"), PocketmineBufferPhp, "binary");
      } else {
        ReturnObject.skip = true;
      }
    } else {
      throw Error("Pocketmine-MP not suported");
    }
  }

  // if the platform does not exist
  else throw Error("No Valid Platform");

  // Update Config Version
  bds.BdsSettings.UpdateServerVersion(ReturnObject.version, CurrentPlatform);

  // Return info download
  return ReturnObject;
}

// Export
module.exports.DownloadServer = BdsDownload;