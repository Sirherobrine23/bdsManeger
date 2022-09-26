import path from "node:path";
import fs from "node:fs/promises";
import { execFileAsync } from "../childPromisses";
import { actions } from "../globalPlatfroms";
import { pluginHooksFolder } from "../pathControl";
import { saveFile } from "../httpRequest";

export type hooksPlatform = "bedrock"|"java"|"pocketmine"|"spigot"|"powernukkit"|"paper";
export type hooksPlatformGeneric = hooksPlatform|"generic";
export type hooksRegister = {
  scriptName: string,
  platforms: hooksPlatformGeneric[],
  register: (actions: actions) => void,
};

async function exists(path: string) {
  return fs.access(path).then(() => true).catch(() => false);
}

const gitUrlDetect = /(^http:\/\/.*\.git$|^http:\/\/.*.git$|^git:\/\/)/;

export class script_hook {
  #serverActions: actions;
  #currentPlatform: hooksPlatformGeneric;
  #localFolder: string;
  #localGericFolder = path.join(pluginHooksFolder, "Generic");

  async #registerScript(filePath: string) {
    const script = (await(eval(`import("${filePath}")`))) as hooksRegister;
    if (!script.scriptName) return;
    else if (!script.register) return;
    else if (!(script.platforms.includes(this.#currentPlatform)||script.platforms.includes("generic"))) return;
    const { scriptName, register } = script;
    if (process.env.DEBUG === "1"||process.env.DEBUG === "true"||process.env.DEBUG === "ON") console.info("Loading hook %s (External)", scriptName);
    return (Promise.resolve().then(() => register(this.#serverActions))).then(() => console.log("hook %s loaded (External)", scriptName));
  };

  async #loadLocalScript() {
    if (!this.#serverActions) throw new Error("Server actions (globalPlatform) is undefined");
    if (await exists(this.#localFolder)) await fs.mkdir(this.#localFolder, {recursive: true});
    if (await exists(this.#localGericFolder)) await fs.mkdir(this.#localGericFolder, {recursive: true});
    for (const localFile of (await fs.readdir(this.#localFolder)).map(file => path.join(this.#localFolder, file))) await fs.lstat(localFile).then(async stat => {
      if (stat.isFile()) return this.#registerScript(localFile);
      if (await exists(path.join(localFile, "package.json"))) {
        const externalHookPackage = JSON.parse(await fs.readFile(path.join(localFile, "package.json"), "utf8"));
        let indexFile: string;
        if (externalHookPackage.main) indexFile = path.join(localFile, externalHookPackage.main);
        else {
          const files = (await fs.readdir(localFile)).filter(file => /index\.(js|cjs|mjs)$/.test(file));
          if (files.length === 0) throw new Error("no index files");
          indexFile = path.join(localFile, files[0]);
        }
        if (!indexFile) throw new Error("No file to init");
        return this.#registerScript(indexFile);
      }
      throw new Error("Know know, boom!");
    }).catch(err => console.error(String(err)));
  }

  constructor(platformActions: actions, targetPlatform: hooksPlatform) {
    this.#serverActions = platformActions;
    if (targetPlatform === "spigot") this.#localFolder = path.join(pluginHooksFolder, "Spigot");
    else if (targetPlatform === "paper") this.#localFolder = path.join(pluginHooksFolder, "Spigot");
    else if (targetPlatform === "pocketmine") this.#localFolder = path.join(pluginHooksFolder, "PocketmineMP");
    else if (targetPlatform === "powernukkit") this.#localFolder = path.join(pluginHooksFolder, "Powernukkit");
    else if (targetPlatform === "bedrock") this.#localFolder = path.join(pluginHooksFolder, "Bedrock");
    else if (targetPlatform === "java") this.#localFolder = path.join(pluginHooksFolder, "Java");
    else throw new Error("Invalid platform");
    this.#loadLocalScript();
  }

  public async installHook(urlHost: string, fileName?: string, isGeneric?: boolean) {
    if (!fileName) fileName = path.basename(urlHost);
    const onSave = path.join(isGeneric?this.#localGericFolder:this.#localFolder, fileName);
    // Git
    if (gitUrlDetect.test(urlHost)) {
      await execFileAsync("git", ["clone", urlHost, "--depth", 1, onSave], {cwd: pluginHooksFolder});
      if (await exists(path.join(onSave, "package.json"))) await execFileAsync("npm", ["install", "--no-save"], {cwd: onSave, stdio: "inherit"});
    } else await saveFile(urlHost, {filePath: onSave});
    return this.#registerScript(onSave);
  }
}