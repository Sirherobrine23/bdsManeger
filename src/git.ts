import * as child_process from "node:child_process";
import * as util from "node:util";
// import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import * as path from "node:path";
import admZip from "adm-zip";

const execFile = util.promisify(child_process.execFile);

export class git {
  private repoRoot = "";
  public async status() {
    const data = await execFile("git", ["status", "-s"], {cwd: this.repoRoot});
    const status = {
      modified: [] as string[],
      new: [] as string[],
      deleted: [] as string[],
      untracked: [] as {file: string, action: string}[],
    };
    for (const line of data.stdout.split(/\r?\n/g)) {
      const match = line.trim().match(/^(.*)\s+(.*)$/);
      if (!match) continue;
      const [, action, filePath] = match;
      if (action.trim() === "??") status.new.push(path.resolve(this.repoRoot, filePath));
      else if (action.trim() === "M") status.modified.push(path.resolve(this.repoRoot, filePath));
      else if (action.trim() === "D") status.deleted.push(path.resolve(this.repoRoot, filePath));
      else status.untracked.push({file: path.resolve(this.repoRoot, filePath), action: action.trim()});
    }
    return status;
  }

  public async add(files: string|string[]) {
    const args = ["add"];
    if (typeof files === "string") args.push(files); else if (files instanceof Array) args.push(...files); else throw new Error("Files is not a string or array");
    const repoStatus = await this.status();
    if ((repoStatus.deleted.length + repoStatus.modified.length + repoStatus.new.length + repoStatus.untracked.length) === 0) throw new Error("No changes");
    await execFile("git", args, {cwd: this.repoRoot});
    return this;
  }

  public async commit(message: string, body?: string[]) {
    if (!message) throw new Error("No commit message");
    else if (message.length > 72) throw new Error("Message length is long");
    const messages = ["-m", message];
    if (body?.length > 0) body.forEach(message => messages.push("-m", message));
    await execFile("git", ["commit", "-m", ...messages], {cwd: this.repoRoot});
    return this;
  }

  public async push(branch?: string, remote?: string, force: boolean = false) {
    const args = ["push"];
    if (branch) args.push(branch);
    if (remote) args.push(remote);
    if (force) args.push("--force");
    await execFile("git", args, {cwd: this.repoRoot});
    return this;
  }

  public getZip(gitPath: string = "/", callback: (zipDate: Buffer) => void) {
    if(!!gitPath) if (!fsOld.existsSync(path.join(this.repoRoot, gitPath))) throw new Error("Path does not exist");
    new Promise<void>(done => {
      const newZipFile = new admZip();
      if (!gitPath) gitPath = "/";
      newZipFile.addLocalFolder(path.normalize(path.join(this.repoRoot)), "/", (filename) => !/\.git/.test(filename));
      callback(newZipFile.toBuffer());
      done();
    });
    return this;
  }

  public remote(action: "remove", remote: string): this;
  public remote(action: "setHead"): this;
  public remote(action: "prune"): this;
  public remote(action: "show", callback: (error: Error|undefined, data: {name: string, url: string, type?: string}[]) => void): this;
  public remote(action: "add", config: {gitUrl: string, remoteName?: string, auth?: {username: string, password: string}, user?: {name: string, email: string}}, callback: (error: Error|undefined, data: {url: string, auth?: {username: string, password?: string}}) => void): this;
  public remote(action: "show"|"remove"|"prune"|"setHead"|"add", ...args: any[]) {
    if (action === "show") {
      if (typeof args[0] !== "function") throw new Error("Callback is not a function");
      execFile("git", ["remote", "show"], {cwd: this.repoRoot}).then(remotes => {
        const result = remotes.stdout.split(/\r?\n/g).filter(x => !!x.trim()).map(x => {
          const match = x.trim().match(/^(.*)\s+(.*)\s+(\(\d+\))$/) || x.trim().match(/^(.*)\s+(.*)$/);
          if (!match) return null;
          const [, name, url, type] = match;
          return {name, url, type: type ? type.trim() : undefined} as {name: string, url: string, type?: string};
        });
        args[0](undefined, result.filter(x => x !== null));
      }).catch(error => args[0](error));
    } else if (action === "prune") {
      if (args[0]) execFile("git", ["remote", "prune", "--dry-run", args[0]], {cwd: this.repoRoot});
      else {
        execFile("git", ["remote", "show"], {cwd: this.repoRoot}).then(async ({stdout}) => {
          const remotes = stdout.split(/\r?\n/g).filter(x => !!x.trim()).map(x => x.trim());
          for (const remote of remotes) {
            await execFile("git", ["remote", "prune", "--dry-run", remote], {cwd: this.repoRoot});
          }
        });
      }
    } else if (action === "setHead") execFile("git", ["remote", "set-head", "--auto"], {cwd: this.repoRoot});
    else if (action === "remove") {execFile("git", ["remote", "remove", args[0]], {cwd: this.repoRoot});}
    else if (action === "add") {
      if (typeof args[1] !== "function") throw new Error("Callback is not a function");
      if (typeof args[0] !== "object" && args[0] instanceof Object) throw new Error("Config is not an object");
      if (!args[0].gitUrl) throw new Error("No git url");
      if (args[0].user) {
        if (!args[0].user.name) throw new Error("No user name");
        if (!args[0].user.email) throw new Error("No user email");
      }
      if (args[0].auth) {
        if (!args[0].auth.username) throw new Error("No auth username");
        if (!args[0].auth.password) console.warn("Auth password/token is not set, check your config if exist credentials authentication");
      }
      const config = {
        url: args[0].gitUrl as string,
        remoteName: (!!args[0].remoteName ? args[0].name : "origin") as string,
        user: args[0].user as undefined|{name: string, email: string},
        auth: args[0].auth as undefined|{username: string, password?: string}
      };
      new Promise<void>(async (done): Promise<any> => {
        const urlParse = new URL(config.url);
        let url = urlParse.protocol + "//";
        if (config.auth) {
          url += config.auth.username;
          if (config.auth.password) url += ":" + config.auth.password;
          url += "@";
        } else if (urlParse.username) {
          url += urlParse.username;
          if (urlParse.password) url += ":" + urlParse.password;
          url += "@";
        }
        url += urlParse.hostname+urlParse.pathname+urlParse.search;
        await execFile("git", ["remote", "add", "-f", "--tags", config.remoteName, url], {cwd: this.repoRoot});
        // Done
        return done();
      });
    }
    return this;
  }

  constructor(gitPath: string, config?: {remoteUrl?: string}) {
    this.repoRoot = path.resolve(gitPath);
    if (!fsOld.existsSync(this.repoRoot)) {
      fsOld.mkdirSync(this.repoRoot, {recursive: true});
      child_process.execFileSync("git", ["init", "-b", "main"], {cwd: this.repoRoot});
    }

    // Set url
    if (config?.remoteUrl) this.remote("add", {gitUrl: config.remoteUrl}, () => undefined);
  }
}