import path from "node:path";
import * as http_request from "../httpRequest";
import type { bdsPlatform } from "../platformPathManeger";

export type pluginConfig = {
  name: string,
  url: string,
  fileName?: string,
  platforms: bdsPlatform[],
  dependecies?: string[],
  /** @deprecated */
  scripts?: string[],
};

export class pluginManeger {
  #pluginFolder: string;
  constructor(pluginFolder: string) {
    this.#pluginFolder = pluginFolder;
  }

  async installPlugin(pluginName: string) {
    let pluginUrl = pluginName;
    if (!/^http[s]:\/\//.test(pluginName)) {
      const file = (await http_request.githubTree("The-Bds-Maneger", "plugin_list")).tree.find(file => file.path.includes("plugins/") && file.path.endsWith(".json") && path.parse(file.path.toLowerCase()).name === pluginName);
      if (!file) throw new Error("Cannot find plugin!");
      pluginUrl = `https://raw.githubusercontent.com/The-Bds-Maneger/plugin_list/main/${file.path}`;
    }
    const pluginConfig: pluginConfig = await http_request.getJSON(pluginUrl);
    if (!pluginConfig.fileName) pluginConfig.fileName = path.basename(pluginConfig.url);
    await http_request.saveFile(pluginConfig.url, {
      filePath: path.join(this.#pluginFolder, pluginConfig?.fileName)
    });
    await Promise.all(pluginConfig.dependecies?.map(depencie => this.installPlugin(depencie)));
    if (pluginConfig.scripts) console.info("Plese migrate (%s) script to hooks", pluginConfig.fileName);
  }
};