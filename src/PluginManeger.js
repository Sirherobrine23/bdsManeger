// const RawGithubUrl = "https://raw.githubusercontent.com/The-Bds-Maneger/Plugins_Repository/main";
const path = require("path");
const fs = require("fs");
const request = require("./lib/Requests");
const BdsSettings = require("./lib/BdsSettings");

/**
 * @returns {<{
 *  listVersions: () => Promise<Array<{
 *    name: string;
 *    versions: Array<{
 *      version: string;
 *      url: string;
 *      id: number;
 *    }>;
 *  }>;
 *  Install: (PluginName: string, PluginVersion?: string) => Promise<string>;
 * >}
 */
function PluginManegerPocketmine() {
  async function Poggit_pmmp() {
    let PluginsJsonPoggit = await request.json("https://poggit.pmmp.io/plugins.json");
    let PluginsObject = {};
    for (const Plugin of PluginsJsonPoggit) {
      if (!PluginsObject[Plugin.name]) PluginsObject[Plugin.name] = {
        name: Plugin.name,
        versions: []
      };
      PluginsObject[Plugin.name].versions.push({
        version: Plugin.version,
        url: `https://poggit.pmmp.io/get/${Plugin.name}/${Plugin.version}`,
        id: Plugin.id
      });
    }
    return Object.keys(PluginsObject).map(PluginName => {
      const Plugin = PluginsObject[PluginName];
      return {
        name: String(Plugin.name),
        versions: Array.from(Plugin.versions).map(Version => {
          const NewValue = {};
          NewValue.version = String(Version.version);
          NewValue.url = String(Version.url);
          NewValue.id = Number(Version.id);
          return NewValue;
        })
      }
    });
  }
  const Install = async (PluginName = "", PluginVersion = "latest") => {
    if (!PluginName) throw new Error("Plugin name is empty");
    const PluginsList = (await Poggit_pmmp()).filter(Plugin => Plugin.name === PluginName)[0];
    if (!PluginsList) throw new Error(`Plugin ${PluginName} not found`);
    const Plugin = PluginsList.versions.filter(Version => Version.version === PluginVersion)[0];
    if (!Plugin) throw new Error(`Plugin ${PluginName} version ${PluginVersion} not found`);
    const PluginBufferfile = await request.buffer(Plugin.url);
    const PluginFile = path.join(BdsSettings.GetPaths("pocketmine", true), "plugins", `${PluginName}.phar`);
    fs.writeFileSync(PluginFile, PluginBufferfile);
    return PluginFile;
  }

  return {
    listVersions: Poggit_pmmp,
    Install: Install,
  };
}

module.exports = {
  PluginManeger: (platform = BdsSettings.CurrentPlatorm()) => {
    switch (platform) {
      case "pocketmine":
        return PluginManegerPocketmine();
      default:
        throw new Error(`Platform ${platform} not found`);
    }
  }
};