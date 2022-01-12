// const RawGithubUrl = "https://raw.githubusercontent.com/The-Bds-Maneger/Plugins_Repository/main";
const path = require("path");
const fs = require("fs");
const request = require("./lib/Requests");
const BdsSettings = require("./lib/BdsSettings");

function PluginManegerPocketmine() {
  async function Poggit_pmmp() {
    let PluginsJsonPoggit = [{"id":466,"name":"XYZ","version":"1.0.3","html_url":"https://poggit.pmmp.io/p/XYZ/1.0.3","tagline":"aka 'Coords' by Unerds","artifact_url":"https://poggit.pmmp.io/r/9413","downloads":124,"score":null,"repo_id":96703537,"repo_name":"poggit-orphanage/XYZ","project_id":617,"project_name":"XYZ","build_id":26433,"build_number":5,"build_commit":"b3a229bb91e196a87e3078148009c6ab7fcc7fac","description_url":"https://poggit.pmmp.io/r/9410","icon_url":"https://raw.githubusercontent.com/poggit-orphanage/XYZ/b3a229bb91e196a87e3078148009c6ab7fcc7fac/icon.png","changelog_url":"https://poggit.pmmp.io/r/9412","license":"none","license_url":null,"is_obsolete":false,"is_pre_release":false,"is_outdated":false,"is_official":false,"submission_date":1501605759,"state":5,"last_state_change_date":1501605797,"categories":[{"major":true,"category_name":"Informational"},{"major":false,"category_name":"Admin Tools"},{"major":false,"category_name":"General"}],"keywords":["coords","coordinates"],"api":[{"from":"3.0.0-ALPHA7","to":"3.0.0-ALPHA7"}],"deps":[],"producers":{"Collaborator":["unerds","awzaw","sof3"]},"state_name":"Approved"},{"id":429,"name":"XYZ","version":"1.0.2","html_url":"https://poggit.pmmp.io/p/XYZ/1.0.2","tagline":"aka 'Coords' by Unerds","artifact_url":"https://poggit.pmmp.io/r/8177","downloads":232,"score":null,"repo_id":96703537,"repo_name":"poggit-orphanage/XYZ","project_id":617,"project_name":"XYZ","build_id":25455,"build_number":3,"build_commit":"d1c371dac7bc0189d6cca764dd5639b7273840f5","description_url":"https://poggit.pmmp.io/r/8175","icon_url":"https://raw.githubusercontent.com/poggit-orphanage/XYZ/d1c371dac7bc0189d6cca764dd5639b7273840f5/icon.png","changelog_url":null,"license":"none","license_url":null,"is_obsolete":false,"is_pre_release":false,"is_outdated":false,"is_official":false,"submission_date":1499639006,"state":5,"last_state_change_date":1499627437,"categories":[{"major":true,"category_name":"Informational"},{"major":false,"category_name":"Admin Tools"},{"major":false,"category_name":"General"}],"keywords":["coords","coordinates"],"api":[{"from":"2.0.0","to":"3.0.0-ALPHA6"}],"deps":[],"producers":{"Collaborator":["unerds","awzaw","sof3"]},"state_name":"Approved"}];
    PluginsJsonPoggit = await request.json("https://poggit.pmmp.io/plugins.json");
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