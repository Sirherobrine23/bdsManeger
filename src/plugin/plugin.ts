import path from "node:path";
import type { bdsPlatform } from "../platformPathManeger";
import { httpRequest, httpRequestLarge } from "@the-bds-maneger/core-utils";

export type pluginConfig = {
  version?: 1,
  name: string,
  url: string,
  fileName?: string,
  platforms: bdsPlatform[],
  dependecies?: string[],
  /** @deprecated */
  scripts?: string[],
};

export type pluginV2 = {
  version: 2,
  name: string,
  pluginVersion?: string,
  platform: {
    [platform: string]: {
      url: string,
      fileName?: string,
      dependencies?: string[]
    }
  }
};

export class pluginManeger {
  #pluginFolder: string;
  #platform: bdsPlatform;
  constructor(pluginFolder: string, options?: {
    bdsPlatfrom: bdsPlatform
  }) {
    this.#pluginFolder = pluginFolder;
    this.#platform = options?.bdsPlatfrom;
  }

  async installPlugin(plugin: string) {
    const urlandbds = /http[s]:\/\/|bdsplugin:\/\//;
    if (/bdsplugin:\/\//.test(plugin)) plugin = `https://raw.githubusercontent.com/The-Bds-Maneger/plugin_list/main/plugins/${plugin.replace(urlandbds, "").replace(".json", "")}.json`;
    else if (!/http[s]:\/\/\//.test(plugin)) plugin = "bdsplugin://"+plugin;
    const info = await httpRequest.getJSON<pluginConfig|pluginV2>(plugin);
    if (info.version === 2) {
      const platformData = info.platform[this.#platform];
      if (!platformData) throw new Error("Platform not supported to Plugin!");
      await httpRequestLarge.saveFile({
        url: platformData.url,
        filePath: path.join(this.#pluginFolder, platformData.fileName||path.basename(platformData.url))
      });
      if (platformData.dependencies) await Promise.all(platformData.dependencies.map(dep => this.installPlugin(dep)));
      return;
    }
    if (!info.platforms.includes(this.#platform)) throw new Error("Platform not supported to Plugin!");
    await httpRequestLarge.saveFile({
      url: info.url,
      filePath: path.join(this.#pluginFolder, info.fileName||path.basename(info.url))
    });
    if (info.dependecies) await Promise.all(info.dependecies.map(dep => this.installPlugin(dep)));
  }
};
