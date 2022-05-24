/**
 * Original file url: https://github.com/chegele/BDSAddonInstaller/blob/6e9cf7334022941f8007c28470eb1e047dfe0e90/index.js
 * License: No license provided.
 * Github Repo: https://github.com/chegele/BDSAddonInstaller
 *
 * Patch by Sirherorine23 (Matheus Sampaio Queirora) <srherobrine20@gmail.com>
 */
import path from "node:path";
import admZip from "adm-zip";
import fs from "node:fs";
import { serverRoot } from "../../pathControl";
// import stripJsonComments from "strip-json-comments";

const stripJsonComments = (data: string) => data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);

function ensureFileSync(pathFile: string){
  if (!fs.existsSync(pathFile)){
  if (!fs.existsSync(path.parse(pathFile).dir)) fs.mkdirSync(path.parse(pathFile).dir, {recursive: true});
    fs.writeFileSync(pathFile, "");
  }
}

// Below variables are updated by the constructor.
// All paths will be converted to full paths by including serverPath at the beginning.
let serverPath = null;
let worldName = null;

const providedServerPath = path.join(serverRoot, "bedrock");
const addonPath = path.resolve(providedServerPath, "../BDS-Addons/");
if (!(fs.existsSync(addonPath))) fs.mkdirSync(addonPath, {recursive: true});

let serverPacksJsonPath = "valid_known_packs.json";
let serverPacksJSON = null;
let serverResourcesDir = "resource_packs/";
let serverBehaviorsDir = "behavior_packs/";

let worldResourcesJsonPath = "worlds/<worldname>/world_resource_packs.json";
let worldResourcesJSON = null;
let worldBehaviorsJsonPath = "worlds/<worldname>/world_behavior_packs.json";
let worldBehaviorsJSON = null;
let worldResourcesDir = "worlds/<worldname>/resource_packs/";
let worldBehaviorsDir = "worlds/<worldname>/behavior_packs/";

// Below variables updated by mapInstalledPacks function.
// Updated to contain installed pack info {name, uuid, version, location}
let installedServerResources = new Map();
let installedServerBehaviors = new Map();
let installedWorldResources = new Map();
let installedWorldBehaviors = new Map();

/**
 * Prepares to install addons for the provided Bedrock Dedicated Server.
 */
export function addonInstaller() {
  // Update all module paths from relative to full paths.
  serverPath = providedServerPath;
  // addonPath = path.join(providedServerPath, addonPath);
  worldName = readWorldName();
  worldResourcesJsonPath = path.join(serverPath, worldResourcesJsonPath.replace("<worldname>", worldName));
  worldBehaviorsJsonPath = path.join(serverPath, worldBehaviorsJsonPath.replace("<worldname>", worldName));
  worldResourcesDir = path.join(serverPath, worldResourcesDir.replace("<worldname>", worldName));
  worldBehaviorsDir = path.join(serverPath, worldBehaviorsDir.replace("<worldname>", worldName));
  serverPacksJsonPath = path.join(serverPath, serverPacksJsonPath);
  serverResourcesDir = path.join(serverPath, serverResourcesDir);
  serverBehaviorsDir = path.join(serverPath, serverBehaviorsDir);

  // Create JSON files if they do not exists
  ensureFileSync(serverPacksJsonPath);
  ensureFileSync(worldResourcesJsonPath);
  ensureFileSync(worldBehaviorsJsonPath);

  // Read installed packs from JSON files & attempt to parse content.
  let serverPackContents = fs.readFileSync(serverPacksJsonPath, "utf8");
  let worldResourceContents = fs.readFileSync(worldResourcesJsonPath, "utf8");
  let worldBehaviorContents = fs.readFileSync(worldBehaviorsJsonPath, "utf8");
  // If there is an error parsing JSON assume no packs installed and use empty array.
  try { serverPacksJSON = JSON.parse(serverPackContents) } catch(err) { serverPacksJSON = [] };
  try { worldResourcesJSON = JSON.parse(worldResourceContents) } catch(err) { worldResourcesJSON = [] };
  try { worldBehaviorsJSON = JSON.parse(worldBehaviorContents) } catch(err) { worldBehaviorsJSON = [] };
  // If unexpected results from parsing JSON assume no packs installed and use empty array.
  if (!Array.isArray(serverPacksJSON)) serverPacksJSON = [];
  if (!Array.isArray(worldResourcesJSON)) worldResourcesJSON = [];
  if (!Array.isArray(worldBehaviorsJSON)) worldBehaviorsJSON = [];

  // Map installed packs from install directories
  installedServerResources = mapInstalledPacks(serverResourcesDir);
  installedServerBehaviors = mapInstalledPacks(serverBehaviorsDir);
  installedWorldResources = mapInstalledPacks(worldResourcesDir);
  installedWorldBehaviors = mapInstalledPacks(worldBehaviorsDir);

  /**
   * Installs the provide addon/pack to the BDS server and the active world.
   * @param {String} packPath - The full path to the mcpack or mcaddon file.
   */
  async function installAddon(packPath: string) {

    // Validate provided pack (pack exists & is the correct file type)
    if (!fs.existsSync(packPath)) throw new Error("Unable to install pack. The provided path does not exist. " + packPath);
    if (!packPath.endsWith(".mcpack") && !packPath.endsWith(".mcaddon")) throw new Error("Unable to install pack. The provided file is not an addon or pack. " + packPath);
    if (packPath.endsWith(".mcaddon")) {
      // If the provided pack is an addon extract packs and execute this function again for each one.
      let packs = await extractAddonPacks(packPath);
      for (const pack of packs) await this.installAddon(pack);
      return;
    }

    // Gather pack details from the manifest.json file
    let manifest = await extractPackManifest(packPath);
    // let name = manifest.header.name.replace(/\W/g, "");
    let uuid = manifest.header.uuid;
    let version = manifest.header.version;
    if (!version) version = manifest.header.modules[0].version;
    let type: string;
    if (manifest.modules) {
      type = manifest.modules[0].type.toLowerCase();
    } else if (manifest.header.modules) {
      type = manifest.header.modules[0].type.toLowerCase();
    }else {
      throw new Error("Unable to install pack. Unknown pack manifest format.\n" + packPath);
    }

    // console.log("BDSAddonInstaller - Installing " + name + "...");

    // Check if already installed
    let installedWorldPack: any;
    let installedServerPack: any = null;
    if (type == "resources") {
      installedWorldPack = installedWorldResources.get(uuid);
      installedServerPack = installedServerResources.get(uuid);
    }else if (type == "data") {
      installedWorldPack = installedWorldBehaviors.get(uuid);
      installedServerPack = installedServerBehaviors.get(uuid)
    }

    // Check if current installed packs are up to date
    if (installedWorldPack || installedServerPack) {
      let upToDate = true;
      if (installedWorldPack && installedWorldPack.version.toString() != version.toString()) upToDate = false;
      if (installedServerPack && installedServerPack.version.toString() != version.toString()) upToDate = false;
      if (upToDate) {
        // console.log(`BDSAddonInstaller - The ${name} pack is already installed and up to date.`);
        return;
      }else{
        // uninstall pack if not up to date
        // console.log("BDSAddonInstaller - Uninstalling old version of pack");
        if (installedServerPack) await uninstallServerPack(uuid, installedServerPack.location);
        if (installedWorldPack && type == "resources") await uninstallWorldResource(uuid, installedWorldPack.location);
        if (installedWorldPack && type == "data") await uninstallWorldBehavior(uuid, installedWorldPack.location);
      }
    }

    await installPack(packPath, manifest);
    // console.log("BDSAddonInstaller - Successfully installed the " + name + " pack.");

  }

  /**
   * Installs all of the addons & packs found within the BDS-Addons directory.
   * NOTE: Running this function with remove packs is only recommended if facing issues.
   */
  async function installAllAddons(removeOldPacks: boolean) {
    // If chosen, uninstall all world packs.
    if (removeOldPacks) await uninstallAllWorldPacks();

    // Read all packs & addons from BDS-Addon directory.
    let packs = fs.readdirSync(addonPath);

    // Get the full path of each addon/pack and install it.
    for (let pack of packs) {
      try {
        let location = path.join(addonPath, pack);
        await this.installAddon(location);
      }catch(err) {
        // console.error("BDSAddonInstaller - " + err);
      }
    }
  }
  return {
    installAddon,
    installAllAddons
  };
}

////////////////////////////////////////////////////////////////
// BDSAddonInstaller - Install & Uninstall functions

/**
 * Installs the provided pack to the world and Bedrock Dedicated Server.
 * @param packPath - The path to the pack to be installed.
 * @param manifest - The pre-parsed manifest information for the pack.
 */
async function installPack(packPath: string, manifest: {[d: string]: any}) {
  // Extract manifest information
  let name = manifest.header.name.replace(/\W/g, "");
  let uuid = manifest.header.uuid;
  let version = manifest.header.version;
  if (!version) version = manifest.header.modules[0].version;
  let type: string;
  if (manifest.modules) {
    type = manifest.modules[0].type.toLowerCase();
  } else if (manifest.header.modules) {
    type = manifest.header.modules[0].type.toLowerCase();
  }else {
    throw new Error("Unable to install pack. Unknown pack manifest format.\n" + packPath);
  }

  // Create placeholder variables for pack installation paths.
  let installServerPath: string
  let installWorldPath: string
  let WorldPacksJSON: any
  let WorldPacksPath: string
  let rawPath: string|null = null;

  // Update variables based on the pack type.
  if (type == "data") {
    installServerPath = path.join(serverBehaviorsDir, name);
    installWorldPath = path.join(worldBehaviorsDir, name);
    WorldPacksJSON = worldBehaviorsJSON;
    WorldPacksPath = worldBehaviorsJsonPath;
    rawPath = "behavior_packs/" + name;
  }else if (type == "resources") {
    installServerPath = path.join(serverResourcesDir, name);
    installWorldPath = path.join(worldResourcesDir, name);
    WorldPacksJSON = worldResourcesJSON;
    WorldPacksPath = worldResourcesJsonPath;
    rawPath = "resource_packs/" + name;
  }else {
    throw new Error("Unknown pack type, " + type);
  }

  // Install pack to the world.
  let worldPackInfo = {"pack_id": uuid, "version": version}
  WorldPacksJSON.unshift(worldPackInfo);
  await promiseExtract(packPath, installWorldPath);
  fs.writeFileSync(WorldPacksPath, JSON.stringify(WorldPacksJSON, undefined, 2));

  // Install pack to the server.
  version = `${version[0]}.${version[1]}.${version[2]}`;
  let serverPackInfo = {"file_system": "RawPath", "node:path": rawPath, "uuid": uuid, "version": version};
  serverPacksJSON.splice(1, 0, serverPackInfo);
  await promiseExtract(packPath, installServerPath);
  fs.writeFileSync(serverPacksJsonPath, JSON.stringify(serverPacksJSON, undefined, 2));
}

/**
 * Uninstall all resource and behavior packs from the Minecraft world.
 * If the server also has the pick it will also be uninstalled.
 * NOTE: Vanilla packs can"t be safely removed from the server packs & there is no way to differentiate vanilla and added packs.
 * NOTE: This is why only packs found installed to the world will be removed from the server.
 */
async function uninstallAllWorldPacks() {
  // console.log("BDSAddonInstaller - Uninstalling all packs found saved to world.");

  // Uninstall all cached world resource packs.
  for (let pack of installedWorldResources.values()) {
    await uninstallWorldResource(pack.uuid, pack.location);
    let serverPack = installedServerResources.get(pack.uuid);
    if (serverPack) await uninstallServerPack(pack.uuid, serverPack.location);
  }

  // Uninstall all cached world behavior packs.
  for (let pack of installedWorldBehaviors.values()) {
    await uninstallWorldBehavior(pack.uuid, pack.location);
    let serverPack = installedServerBehaviors.get(pack.uuid);
    if (serverPack) await uninstallServerPack(pack.uuid, serverPack.location);
  }

  // All packs are cached by the constructor.
  // Reload world packs after uninstall.
  installedServerResources = mapInstalledPacks(serverResourcesDir);
  installedServerBehaviors = mapInstalledPacks(serverBehaviorsDir);
  installedWorldResources = mapInstalledPacks(worldResourcesDir);
  installedWorldBehaviors = mapInstalledPacks(worldBehaviorsDir);
}

// TODO: uninstallWorldResource, uninstallWorldBehavior, and uninstallServerPack share the same logic.
// These functions can be merged into one function using an additional argument for pack type.

/**
 * Uninstalls the pack from the world_resource_packs.json by uuid & deletes the provided pack path.
 * @param uuid - The id of the pack to remove from the world_resource_packs.json file.
 * @param location - The path to the root directory of the installed pack to be deleted.
 * WARNING: No validation is done to confirm that the provided path is a pack.
 */
async function uninstallWorldResource(uuid: string, location: string) {
  // Locate the pack in the manifest data.
  let packIndex = findIndexOf(worldResourcesJSON, "pack_id", uuid);

  // Remove the pack data and update the json file.
  if (packIndex != -1) {
    worldResourcesJSON.splice(packIndex, 1);
    fs.writeFileSync(worldResourcesJsonPath, JSON.stringify(worldResourcesJSON, undefined, 2));
    // console.log(`BDSAddonInstaller - Removed ${uuid} from world resource packs JSON.`);
  }

  // Delete the provided pack path.
  if (fs.existsSync(location)) {
    await fs.promises.rm(location, {recursive: true});
    // console.log(`BDSAddonInstaller - Removed ${location}`);
  }
}

/**
 * Uninstalls the pack from the world_behavior_packs.json by uuid & deletes the provided pack path.
 * @param uuid - The id of the pack to remove from the world_behavior_packs.json file.
 * @param location - The path to the root directory of the installed pack to be deleted.
 * WARNING: No validation is done to confirm that the provided path is a pack.
 */
async function uninstallWorldBehavior(uuid: string, location: string) {
  // Locate the pack in the manifest data.
  let packIndex = findIndexOf(worldBehaviorsJSON, "pack_id", uuid);

  // Remove the pack data and update the json file.
  if (packIndex != -1) {
    worldBehaviorsJSON.splice(packIndex, 1);
    fs.writeFileSync(worldBehaviorsJsonPath, JSON.stringify(worldBehaviorsJSON, undefined, 2));
    // console.log(`BDSAddonInstaller - Removed ${uuid} from world behavior packs JSON.`);
  }

  // Delete the provided pack path.
  if (fs.existsSync(location)) {
    fs.promises.rm(location);
    // console.log(`BDSAddonInstaller - Removed ${location}`);
  }
}

/**
 * Uninstalls the pack from the valid_known_packs.json by uuid & deletes the provided pack path.
 * @param uuid - The id of the pack to remove from the valid_known_packs.json file.
 * @param location - The path to the root directory of the installed pack to be deleted.
 * WARNING: No validation is done to confirm that the provided path is a pack.
 */
async function uninstallServerPack (uuid: string, location: string) {
  // Locate the pack in the manifest data.
  let packIndex = findIndexOf(serverPacksJSON, "uuid", uuid);

  // Remove the pack data and update the json file.
  if (packIndex != -1) {
    serverPacksJSON.splice(packIndex, 1);
    fs.writeFileSync(serverPacksJsonPath, JSON.stringify(serverPacksJSON, undefined, 2));
    // console.log(`BDSAddonInstaller - Removed ${uuid} from server packs JSON.`);
  }

  // Delete the provided pack path.
  if (fs.existsSync(location)) {
    fs.promises.rm(location);
    // console.log(`BDSAddonInstaller - Removed ${location}`);
  }
}

///////////////////////////////////////////////////////////
// BDSAddonInstaller misc functions

/**
 * Extracts bundled packs from the provided addon file.
 * This will only need to be ran once on an addon as it will convert the addon to multiple .mcpack files.
 * @param addonPath - The path of the addon file to extract packs from.
 */
async function extractAddonPacks(addonPath: string) {
  // Validate the provided path is to an addon.
  if (!fs.existsSync(addonPath)) throw new Error("Unable to extract packs from addon. Invalid file path provided: " + addonPath);
  if (!addonPath.endsWith('.mcaddon')) throw new Error('Unable to extract packs from addon. The provided file is not an addon. ' + addonPath);
  // console.log("BDSAddonInstaller - Extracting packs from " + addonPath);

  // Extract file path and name info for saving the extracted packs.
  let addonName = path.basename(addonPath).replace(".mcaddon", "");
  let dirPath = path.dirname(addonPath);

  // Create a temp location and extract the addon contents to it.
  let tempLocation = path.join(dirPath, "tmp/", addonName + "/");
  await promiseExtract(addonPath, tempLocation);
  let packs = fs.readdirSync(tempLocation);
  let results = [];

  // Move addon packs from temporary location to BDS-Addon directory.
  for (let pack of packs) {
    // console.log(`BDSAddonInstaller - Extracting ${pack} from ${addonName}.`);

    // If the mcpack is already packaged, move the file.
    if (pack.endsWith(".mcpack")) {
      let packName = addonName + "_" + pack;
      let packFile = path.join(tempLocation, pack);
      let packDestination = path.join(dirPath, packName);
      await fs.promises.rename(packFile, packDestination);
      results.push(packDestination);
      // console.log("BDSAddonInstaller - Extracted " + packDestination);
    }else {
      // The pack still needs to be zipped and then moved.
      let packName = addonName + "_" + pack + ".mcpack";
      let packFolder = path.join(tempLocation, pack);
      let packDestination = path.join(dirPath, packName);
      await promiseZip(packFolder, packDestination);
      results.push(packDestination);
      // console.log("BDSAddonInstaller - Extracted " + packDestination);
    }
  }

  // Remove temporary files and old addon.
  await fs.promises.rm(path.join(dirPath, "tmp/"), {recursive: true});
  await fs.promises.unlink(addonPath);

  // Return an array of paths to the extracted packs.
  return results;
}

/**
 * Extracts the manifest data as an object from the provided .mcpack file.
 * @param packPath - The path to the pack to extract the manifest from.
 * @returns The parsed manifest.json file.
 */
function extractPackManifest(packPath: string): {[key: string]: any} {
  // Validate the provided pack (path exists and file is correct type)
  if (!fs.existsSync(packPath)) throw new Error("Unable to extract manifest file. Invalid file path provided: " + packPath);
  if (!packPath.endsWith(".mcpack")) throw new Error("Unable to extract manifest file. The provided file is not a pack. " + packPath);
  // console.log("BDSAddonInstaller - Reading manifest data from " + packPath);

  // Locate the manifest file in the zipped pack.
  let archive = new admZip(packPath);
  let manifest = archive.getEntries().filter(entry => entry.entryName.endsWith("manifest.json") || entry.entryName.endsWith("pack_manifest.json"));
  if (!manifest[0]) throw new Error("Unable to extract manifest file. It does not exist in this pack. " + packPath);

  // Read the manifest and return the parsed JSON.
  return JSON.parse(stripJsonComments(archive.readAsText(manifest[0].entryName)));
}


/**
 * Reads the world name from a BDS server.properties file.
 * @returns The value found for level-name from server.properties.
 * NOTE: This function is Synchronous for use in the constructor without need for a callback.
 */
function readWorldName(): string {
  let propertyFile = path.join(serverPath, "server.properties");
  // console.log("BDSAddonInstaller - Reading world name from " + propertyFile);
  if (!fs.existsSync(propertyFile)) throw new Error("Unable to locate server properties @ " + propertyFile);
  let properties = fs.readFileSync(propertyFile);
  let levelName = properties.toString().match(/level-name=.*/);
  if (!levelName) throw new Error("Unable to retrieve level-name from server properties.");
  return levelName.toString().replace("level-name=", "");
}

/**
 * Collects manifest information from all installed packs in provided location.
 * @param directory - The path to the directory containing extracted/installed packs.
 * @returns A collection of manifest information with the uuid as the key.
 *
 * Bug Note:
 * Some of the vanilla packs are installed multiple times using the same uuid but different versions.
 * This causes the map to only capture the last read pack with that uuid.
 * This bug should not impact the installer, as there wont be a need to install / update vanilla packs.
 *
 * NOTE: This function is Synchronous for use in the constructor without need for a callback.
 */

function mapInstalledPacks(directory: string): Map<{}, any> {
  // The provided directory may not exist if the world has no packs installed.
  // Create the results Map & return empty if the directory does not exist.
  let results = new Map();
  if (!fs.existsSync(directory)) return results;

  // Extract manifest & path information for each installed pack
  let subdirectories = fs.readdirSync(directory);
  subdirectories.forEach(subdirectory => {
    let location = path.join(directory, subdirectory);
    // console.log("BDSAddonInstaller - Reading manifest data from " + location);

    // Locate the directory containing the pack manifest.
    let manifestLocation = findFilesSync(["manifest.json", "pack_manifest.json"], location);
    if (!manifestLocation) {
      // console.error(manifestLocation);
      // console.warn("BDSAddonInstaller - Unable to locate manifest file of installed pack.");
      // console.warn("BDSAddonInstaller - Installed location: " + location);
      return;
    }

    // Check if pack is using a manifest.json or pack.manifest.json
    let filePath = path.join(manifestLocation, "manifest.json");
    if (!fs.existsSync(filePath)) filePath = path.join(manifestLocation, "pack_manifest.json");
    let file = fs.readFileSync(filePath, "utf8");

    // Some vanilla packs have comments in them, this is not valid JSON and needs to be removed.
    file = stripJsonComments(file.toString());
    let manifest = JSON.parse(file);

    // Collect and map the manifest information
    let uuid = manifest.header.uuid;
    let name = manifest.header.name;
    let version = manifest.header.version;
    if (!version) version = manifest.header.modules[0].version;
    results.set(uuid, {name, uuid, version, location});
  });
  return results;
}

////////////////////////////////////////////////////////////////////
// Misc helper functions

/**
 * Finds the first index of a key value pair from an array of objects.
 * @param objectArray - An array of objects to search.
 * @param key - The key to match the value against.
 * @param value - The value to find the index of.
 * @returns - The index of the key value pair or -1.
 */
function findIndexOf(objectArray: Array<{[d: string]: any}>, key: string, value: any): number {
  for (let index = 0; index < objectArray.length; index++) {
    if (objectArray[index][key] == value) return index;
  }
  return -1;
}

/**
 * Extracts all of the contents from a provided .zip archive.
 * @param file - The file to extract the contents from.
 * @param destination - The directory to unzip the contents into.
 */
function promiseExtract(file: string, destination: string) {
  return new Promise(function(resolve, reject) {
    let archive = new admZip(file);
    archive.extractAllToAsync(destination, true, true, err => {
      if (err) return reject(err);
      resolve("");
    });
  });
}

/**
 * Compresses contents of the provided folder using ADM Zip.
 * @param folder - The folder containing folder containing the files to compress.
 * @param destinationFile - The file to save the archive as.
 */
function promiseZip(folder: string, destinationFile: string) {
  return new Promise(async function(resolve, reject) {
    let archive = new admZip();
    let contents = await fs.promises.readdir(folder);
    for (let file of contents) {
      let filePath = path.join(folder, file);
      let stat = await fs.promises.stat(filePath);
      stat.isFile() ? archive.addLocalFile(filePath) : archive.addLocalFolder(filePath, file);
    }
    archive.writeZip(destinationFile, err => {
      if (err) return reject(err);
      resolve("");
    });
  });
}

/**
 * Attempt to locate the subdirectory containing one of the provided file names.
 * @param filenames - The name of files to search for.
 * @param directory - The directory to search in.
 * @returns The path to the first folder containing one of the files or null.
 */
function findFilesSync(filenames: Array<string>, directory: string): string {

  // Get the contents of the directory and see if it includes one of the files.
  const contents = fs.readdirSync(directory);
  for (let file of contents) {
    if (filenames.includes(file)) return directory;
  }

  // If unable to find one of the files, check subdirectories.
  for (let subDir of contents) {
    let dirPath = path.join(directory, subDir);
    let stat = fs.statSync(dirPath);
    if (stat.isDirectory()) {
      let subDirectoryResult = findFilesSync(filenames, dirPath);
      if (subDirectoryResult) return subDirectoryResult;
    }
  }

  // Unable to find the files.
  return null;
}


//TODO: Add type definitions for the manifest files.

/**
 * @typedef {Object} PackData - Information extracted from an installed pack.
 * @property {String} name - The name found in the packs manifest.json file.
 * @property {String} uuid - The uuid found in the packs manifest.json file.
 * @property {String} version - the version found in the packs manifest.json fle.
 * @property {String} location - The full path to the root directory of the installed pack.
 * Used by the mapInstalledPacks function
 */
