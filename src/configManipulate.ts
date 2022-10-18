import fs from "node:fs/promises";
import utils from "node:util";
import Proprieties from "./lib/Proprieties";

export type Manipulate = ((config: string, value: any) => string)|{
  validate?: (value: any) => boolean,
  regexReplace: RegExp,
  valueFormat: string,
};
export type configOptions = {
  configPath: string,
  configManipulate: {
    [keyName: string]: Manipulate[]|Manipulate
  }
};

export type configEdit = {name: string, data: any};
export async function manegerConfigProprieties<updateConfig extends configEdit, configJson = any>(config: configOptions) {
  let configFile: string = await fs.readFile(config.configPath, "utf8");
  const mani = {save, editConfig, getConfig: () => Proprieties.parse<configJson>(configFile)};
  async function save() {
    await fs.writeFile(config.configPath, configFile);
    return configFile;
  }

  function editConfig(serverConfig: updateConfig) {
    if (!config.configManipulate[serverConfig.name]) throw new Error("Key name not exist");
    for (const manipulation of (Array.isArray(config.configManipulate[serverConfig.name])?config.configManipulate[serverConfig.name] as Manipulate[]:[config.configManipulate[serverConfig.name] as Manipulate])) {
      if (typeof manipulation === "function") configFile = manipulation(configFile, serverConfig.data);
      else {
        if (typeof manipulation.validate === "function") if (!manipulation.validate(serverConfig.data)) throw new Error("Invaid value");
        configFile = configFile.replace(manipulation.regexReplace, utils.format(manipulation.valueFormat, serverConfig.data));
      }
    }
    return mani;
  }

  return mani;
}