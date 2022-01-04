const request = require("./lib/Requests");
const BdsSettings = require("./lib/BdsSettings");
const path = require("path");
const fs = require("fs");
const js_yaml = require("js-yaml");

const RawGithubUrl = "https://raw.githubusercontent.com/The-Bds-Maneger/Plugins_Repository/main";

async function PluginManeger(BdsPlatform = BdsSettings.GetPlatform()) {
  const GetPluginsPath = async () => {
    return (await request.GithubTree("The-Bds-Maneger/Plugins_Repository", "main")).tree.filter(Tree => Tree.path.startsWith(BdsPlatform));
  }
  if ((await GetPluginsPath()).length === 0) throw new Error(`Bds Platform ${BdsPlatform} not found`);
  const GetPlugin = async (pluginName = "") => {
    if (!pluginName) throw new Error("Plugin name not found");
    const RepositoryPlugins = (await GetPluginsPath());
    if (RepositoryPlugins[0] === undefined) throw new Error(`Bds Platform ${BdsPlatform} not found`);
    const PluginPath = `${BdsPlatform}/${pluginName.charAt(0).toLocaleLowerCase()}/${pluginName}`;
    const PluginArray = RepositoryPlugins.filter(Plugin => Plugin.path.startsWith(PluginPath));
    if (PluginArray[0] === undefined) throw new Error(`Plugin ${pluginName} not found`);
    const ConfigFile = js_yaml.load(await request.text(`${RawGithubUrl}/${PluginPath}/${path.basename(PluginArray.filter(A => /config\.y[a]ml$/gi.test(A.path))[0].path)}`));
    console.log(ConfigFile);
    const ParseConfigVersion = /* ConfigFile.revision.trim() || */ "v1"
    if (fs.existsSync(path.resolve(__dirname, `./PluginManeger/revision/${ParseConfigVersion}/Config`))) throw new Error(`Plugin ${pluginName} is outdated`);
    return require(`./PluginManeger/revision/${ParseConfigVersion}/Config`).Parse(PluginPath, BdsPlatform, ConfigFile);
  }

  const InstallPlugin = async (PluginName = "", Version = "latest") => {
    const Config = await GetPlugin(PluginName);
    const Plugin = Config.versions.filter(Version => Version.version === Version)[0];
    if (Plugin === undefined) throw new Error(`Plugin ${PluginName} version ${Version} not found`);
    if (BdsPlatform === "pocketmine") {
      if (Config.type === "plugin") {
        const PluginPath = path.join(BdsSettings.GetServerPaths("pocketmine"), "plugins");
        fs.writeFileSync(path.join(PluginPath, `${PluginName}.phar`), await request.buffer(Plugin.url));
      } else if (Config.type === "resourcepack") {
        const PluginPath = path.join(BdsSettings.GetServerPaths("pocketmine"), "resourcepacks");
        fs.writeFileSync(path.join(PluginPath, `${PluginName}.zip`), await request.buffer(Plugin.url));
      } else throw new Error(`Plugin ${PluginName} type (${Config.type}) not supported`);
    } else if (BdsPlatform === "bedrock") {
      if (Config.type === "texture") {
        if (Plugin.type === "texture_addon") {
          throw new Error("not implemented");
        } else if (Plugin.type === "addon") {
          throw new Error("not implemented");
        } else if (Plugin.type === "texture") {
          throw new Error("not implemented");
        } else throw new Error(`Plugin ${PluginName} type (${Config.type}) not supported`);
      }
    }
  }

  const PluginList = async () => {
    const PluginList = (await GetPluginsPath()).filter(Plugin => /config\.y[a]ml$/gi.test(Plugin.path)).map(Plugin => Plugin.path.replace(/\/config\.y[a]ml$/gi, "").replace(RegExp(`^${BdsPlatform}/`), ""));
    const NewObject = {};
    for (const PluginPath of PluginList) {
      const [Letter] = PluginPath.split("/");
      if (NewObject[Letter] === undefined) NewObject[Letter] = [];
      NewObject[Letter].push(PluginPath.replace(`${Letter}/`, ""))
    }
    console.log(NewObject);
    return NewObject;
  }

  return {
    GetPlugin,
    InstallPlugin,
    PluginList
  };
}

module.exports = {
  PluginManeger
};