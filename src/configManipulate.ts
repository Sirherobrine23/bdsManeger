import fs from "node:fs/promises";
import utils from "node:util";
import Proprieties, { properitiesBase } from "./lib/Proprieties";

export type configEdit = {name: string, data?: string|number|boolean};
export async function manegerConfigProprieties<updateConfig extends configEdit, configJson extends properitiesBase = any>(config: {configPath: string, configManipulate: {[Properties in updateConfig["name"]]: ((config: string, value: updateConfig["data"]) => string)|{validate?: (value: updateConfig["data"]) => boolean, regexReplace: RegExp, valueFormat: string, addIfNotExist?: string}}}) {
  let configFile = await fs.readFile(config.configPath, "utf8");
  const mani = {save, editConfig, getConfig: () => Proprieties.parse<configJson>(configFile)};
  async function save() {
    await fs.writeFile(config.configPath, configFile);
    return configFile;
  }

  function editConfig(serverConfig: updateConfig) {
    if (!config.configManipulate[serverConfig.name]) throw new Error("Key name not exist");
    const manipulation = config.configManipulate[serverConfig.name as updateConfig["name"]];
    if (typeof manipulation === "function") configFile = manipulation(configFile, serverConfig.data);
    else {
      if (typeof manipulation.validate === "function") if (!manipulation.validate(serverConfig.data)) throw new Error("Invaid value");
      if (!manipulation.regexReplace.test(configFile)) {
        if (manipulation.addIfNotExist) configFile += ("\n"+manipulation.addIfNotExist);
        else throw new Error("Not config exist!");
      }
      configFile = configFile.replace(manipulation.regexReplace, utils.format(manipulation.valueFormat, serverConfig.data));
    }
    return mani;
  }

  return mani;
}