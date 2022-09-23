import path from "node:path/posix";
import fs from "node:fs/promises";
import fsOld from "node:fs";
import admZip from "adm-zip";
import { existsSync } from "node:fs";
import { pluginHooksFolder } from "../pathControl";
import { saveFile, githubTree, getJSON } from "../httpRequest";
import { serverPath as spigotServerPath } from "../spigot";
import { serverPath as papertServerPath } from "../paper";
import { serverPath as pocketmineServerPath } from "../pocketmine";
import { serverPath as powernukkittServerPath } from "../pwnuukit";
import { actions } from "../globalPlatfroms";

export type pluginPlatform = "spigot"|"paper"|"pocketmine"|"powernukkit";
export type pluginFunctions = {
  platforms: pluginPlatform[],
  scriptName?: string,
  register: (actions: actions) => void,
};
export type pluginConfig = {
  name: string,
  fileName?: string,
  url: string,
  type?: "zip"|"jar"|"raw",
  platforms: pluginPlatform[],
  dependes?: (string|pluginConfig)[],
  scripts?: string[]
};

const localScript: pluginFunctions[] = [];

export class pluginManeger {
  #platform: pluginPlatform;
  pluginList: pluginConfig[] = [];
  scriptList: pluginFunctions[] = [];

  #mountRepoRaw(...args: string[]) {
    const ufixPath = path.normalize(path.join("/The-Bds-Maneger/plugin_list/main", path.resolve("/", ...args)));
    return {
      url: "https://raw.githubusercontent.com"+ufixPath,
      addPluginStyle: ufixPath.replace(/\/The\-Bds\-Maneger\/plugin_list\/main\/|\.\//, "")
    };
  }

  async #addPlugin (file?: string): Promise<pluginConfig|void> {
    const config = await getJSON<pluginConfig>(this.#mountRepoRaw(file).url);
    if (this.pluginList.some(plugin => plugin.name === config.name)) return config;
    if (!config.platforms?.includes(this.#platform)) return;
    this.pluginList.push(config);
    if (config.dependes) {
      config.dependes = await Promise.all(config.dependes.map((depend: string) => this.#addPlugin(this.#mountRepoRaw(path.dirname(file), depend).addPluginStyle))) as pluginConfig[];
    }
  };

  async #loadInternalPlugin(plugin: string[]) {
    const scriptLoad = async (script: string) => {
      if (/^http[s]:\/\//.test(script)) {
        let filePath = await saveFile(script);
        const scriptLoad = require(filePath) as pluginFunctions;
        if (scriptLoad.scriptName && !path.extname(scriptLoad.scriptName||"")) scriptLoad.scriptName += ".js";
        let outFile = path.join(pluginHooksFolder, scriptLoad.scriptName||path.basename(script));
        if (!scriptLoad.register) return console.warn("Droping external (%s) script", outFile);
        if (fsOld.existsSync(outFile)) return console.warn("Dropping %s", outFile);
        if (!scriptLoad.scriptName) scriptLoad.scriptName = path.basename(script);
        if (!localScript.some(script => script.scriptName === scriptLoad.scriptName)) localScript.push(scriptLoad);
        if (!this.scriptList.some(script => script.scriptName === scriptLoad.scriptName)) this.scriptList.push(scriptLoad);
        return await fs.cp(filePath, outFile, {force: true});
      } else {
        const scriptLoad = require(script) as pluginFunctions;
        if (!scriptLoad.register) return;
        if (!this.scriptList.some(script => script.scriptName === scriptLoad.scriptName)) this.scriptList.push(scriptLoad);
      }
    }
    await Promise.all(plugin.map(scriptFile => scriptLoad(scriptFile).catch(err => console.error("File/HTTP: %s, Error: %s", scriptFile, String(err)))));
  }

  async installPlugin(name: string) {
    const plugin = this.pluginList.find(plugin => plugin.name === name);
    if (!plugin) throw new Error(`${name} plugin not avaible to install`);
    console.log("Installing %s plugin", plugin.name);
    let pluginFolder: string;
    if (this.#platform === "paper") pluginFolder = path.join(papertServerPath, "plugins");
    else if (this.#platform === "spigot") pluginFolder = path.join(spigotServerPath, "plugins");
    else if (this.#platform === "pocketmine") pluginFolder = path.join(pocketmineServerPath, "plugins");
    else if (this.#platform === "powernukkit") pluginFolder = path.join(powernukkittServerPath, "plugins");
    else throw new Error("Invalid platform");
    if (!existsSync(pluginFolder)) await fs.mkdir(pluginFolder, {recursive: true});
    const saveOut = path.join(pluginFolder, plugin.fileName||`${plugin.name}.${path.extname(plugin.fileName||plugin.url)}`);
    await saveFile(plugin.url, {filePath: saveOut});
    if (plugin.type === "zip") {
      const zip = new admZip(saveOut);
      zip.extractAllTo(pluginFolder, true);
      await fs.rm(saveOut, {force: true});
    }
    if (plugin.scripts) this.#loadInternalPlugin(plugin.scripts.map(file => this.#mountRepoRaw(file).url));
    if (plugin.dependes) await Promise.all(plugin.dependes.map((depend: pluginConfig) => this.installPlugin(depend.name)));
  }

  async loadPlugins() {
    await this.#loadInternalPlugin((await fs.readdir(pluginHooksFolder)).map(file => path.join(pluginHooksFolder, file)));
    for (const file of (await githubTree("The-Bds-Maneger", "plugin_list", "main")).tree.filter(file => file.path.endsWith(".json"))) await this.#addPlugin(file.path);
    return this;
  }

  constructor(platform: pluginPlatform, autoLoad: boolean = true) {
    this.#platform = platform;
    if (autoLoad) this.loadPlugins();
  }
};