import path from "node:path";
import fs from "node:fs/promises";
import admZip from "adm-zip";
import { existsSync } from "node:fs";
import { saveFile } from "../httpRequest";
import { serverPath as spigotServerPath } from "../spigot";
import { serverPath as papertServerPath } from "../paper";
import { serverPath as pocketmineServerPath } from "../pocketmine";
import { serverPath as powernukkittServerPath } from "../pwnuukit";
const defaultFolder = path.join(__dirname, "plugins");

export type pluginPlatform = "spigot"|"paper"|"pocketmine"|"powernukkit";
export type pluginConfig = {
  name: string,
  fileName?: string,
  url: string,
  type?: "zip"|"jar",
  platforms: pluginPlatform[],
  dependes?: (string|pluginConfig)[]
};

export class pluginManeger {
  #platform: pluginPlatform = "spigot";
  pluginList: pluginConfig[] = [];
  getPlatform() {return this.#platform};

  async #addPlugin (file?: string): Promise<pluginConfig|void> {
    const config: pluginConfig = JSON.parse(await fs.readFile(path.join(defaultFolder, file), "utf8"));
    if (this.pluginList.some(plugin => plugin.name === config.name)) return config;
    if (!config.platforms?.includes(this.#platform)) return;
    this.pluginList.push(config);
    if (config.dependes) {
      config.dependes = await Promise.all(config.dependes.filter(depend => typeof depend === "string"?depend.startsWith("./"):false).map((depend: string) => this.#addPlugin(depend.replace("./", "")))) as pluginConfig[];
    }
  };

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
    if (plugin.dependes) await Promise.all(plugin.dependes.map((depend: pluginConfig) => this.installPlugin(depend.name)));
  }

  async loadPlugins() {
    for (const file of await fs.readdir(defaultFolder)) await this.#addPlugin(file);
    return this;
  }

  constructor(platform: pluginPlatform, autoLoad: boolean = true) {
    this.#platform = platform;
    if (autoLoad) this.loadPlugins();
  }
};