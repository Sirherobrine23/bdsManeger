import path from "node:path";
import fs from "node:fs/promises";
import { execFileAsync } from "../childPromisses";
import { actions } from "../globalPlatfroms";
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

  async #registerScript(filePath: string) {
    const lo_script = (await(eval(`import("${filePath}")`))) as hooksRegister|{default: hooksRegister};
    let script: hooksRegister;
    if (lo_script["default"]) script = lo_script["default"];
    else script = lo_script as hooksRegister;
    console.log(script);
    if (!script.scriptName) throw new Error("Scriptname in null");
    if (!script.register) throw new Error("Register not is function");
    if (!(script.platforms.includes("generic")||script.platforms.includes(this.#currentPlatform))) throw new Error(`Cannot get valid platform (${this.#currentPlatform}) (${script.platforms?.join(", ")})`);
    const { scriptName, register } = script;
    console.log("Loading hook %s (External)", scriptName);
    return (Promise.resolve().then(() => register(this.#serverActions))).then(() => console.log("hook %s loaded (External)", scriptName));
  };

  async #loadLocalScript() {
    if (!this.#serverActions) throw new Error("Server actions (globalPlatform) is undefined");
    if (!await exists(this.#localFolder)) await fs.mkdir(this.#localFolder, {recursive: true});
    const localFiles = (await fs.readdir(this.#localFolder)).map(file => path.join(this.#localFolder, file));
    for (const localFile of localFiles) {
      await fs.lstat(localFile).then(async stat => {
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
  }

  public async installHook(urlHost: string, fileName?: string) {
    if (!await exists(this.#localFolder)) await fs.mkdir(this.#localFolder, {recursive: true});
    if (!fileName) fileName = path.basename(urlHost);
    const onSave = path.join(this.#localFolder, fileName);
    // Git
    if (gitUrlDetect.test(urlHost)) {
      await execFileAsync("git", ["clone", urlHost, "--depth", 1, onSave], {cwd: this.#localFolder});
      if (await exists(path.join(onSave, "package.json"))) await execFileAsync("npm", ["install", "--no-save"], {cwd: onSave, stdio: "inherit"});
    } else await saveFile(urlHost, {filePath: onSave});
    if (!!this.#serverActions) await this.#registerScript(onSave);
    return;
  }

  constructor(hookFolder: string, targetPlatform: hooksPlatform, platformActions?: actions) {
    this.#serverActions = platformActions;
    this.#currentPlatform = targetPlatform;
    this.#localFolder = hookFolder;
    if (platformActions) this.#loadLocalScript();
  }
}