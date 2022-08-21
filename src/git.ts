import * as child_process from "node:child_process";
import * as util from "node:util";
// import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import * as path from "node:path";
import admZip from "adm-zip";
const execFile = util.promisify(child_process.execFile);

export type fnWithData = (err: Error|undefined, data: string) => void;
export type fn = (err?: Error) => void;

export class git {
  public readonly repoRoot: string;

  public async status() {
    const data = await execFile("git", ["status", "-s"], {cwd: this.repoRoot});
    const status: {file: string, action: "new"|"modificated"|"deleted"|"under"}[] = [];
    for (const line of data.stdout.split(/\r?\n/g)) {
      const match = line.trim().match(/^(.*)\s+(.*)$/);
      if (!match) continue;
      const [, action, filePath] = match;
      if (action.trim() === "??") status.push({file: path.resolve(this.repoRoot, filePath), action: "new"});
      else if (action.trim() === "M") status.push({file: path.resolve(this.repoRoot, filePath), action: "modificated"});
      else if (action.trim() === "D") status.push({file: path.resolve(this.repoRoot, filePath), action: "deleted"});
      else status.push({file: path.resolve(this.repoRoot, filePath), action: "under"});
    }
    return status;
  }

  public add(files: string|string[], callback: (error?: Error) => void) {
    const args = ["add"];
    if (typeof files === "string") args.push(files); else if (files instanceof Array) args.push(...files); else throw new Error("Files is not a string or array");
    this.status().then(async repoStatus => {
      if (repoStatus.length === 0) throw new Error("No changes");
      await execFile("git", args, {cwd: this.repoRoot});
    }).then(() => callback()).catch(err => callback(err));
    return this;
  }

  public addSync(files: string|string[]): Promise<void> {
    return new Promise<void>((done, reject) => this.add(files, (err) => !!err ? reject(err) : done()));
  }

  public commit(message: string, body: string[], callback: fn): this;
  public commit(message: string, callback: (error: Error) => void): this;
  public commit(message: string, body: string[]): this;
  public commit(message: string): this;
  public commit(message: string, body?: string[]|fn, callback?: fn): this {
    if (!message) throw new Error("No commit message");
    else if (message.length > 72) throw new Error("Message length is long");
    const messages = ["-m", message];
    if (typeof body === "function") {callback = body; body = undefined;}
    if (body instanceof Array) messages.forEach(message => messages.push("-m", message));
    execFile("git", ["commit", "-m", ...messages], {cwd: this.repoRoot}).then(() => callback(undefined)).catch(err => callback(err));
    return this;
  }

  public commitSync(message: string): Promise<void>;
  public commitSync(message: string, body: string[]): Promise<void>;
  public commitSync(message: string, body?: string[]): Promise<void> {
    return new Promise<void>((done, reject) => this.commit(message, body, (err) => !!err ? reject(err) : done()));
  }

  public push(branch: string, remote: string, force: boolean, callback: fn): this;
  public push(branch: string, remote: string, force: boolean): this;
  public push(branch: string, remote: string): this;
  public push(branch: string): this;
  public push(): this;
  public push(branch?: string, remote?: string, force?: boolean, callback?: fn): this {
    this.remote("show", async (err, data) => {
      if (err) if (callback) return callback(err); else throw err;
      if (data.length === 0) return callback(new Error("No remotes"));
      const args = ["push"];
      if (branch) args.push(branch);
      if (remote) args.push(remote);
      if (force) args.push("--force");
      await execFile("git", args, {cwd: this.repoRoot});
    });
    return this;
  }

  public pushSync(branch: string, remote: string, force: boolean): Promise<void>;
  public pushSync(branch: string, remote: string): Promise<void>;
  public pushSync(branch: string): Promise<void>;
  public pushSync(): Promise<void>;
  public pushSync(branch?: string, remote?: string, force?: boolean): Promise<void> {
    return new Promise<void>((done, reject) => this.push(branch, remote, force, (err) => !!err ? reject(err) : done()));
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

  /**
   * Init repository maneger and if not exists create a empty repository
   */
  constructor(gitPath: string, config?: {remoteUrl?: string}) {
    this.repoRoot = path.resolve(gitPath);
    Object.defineProperty(this, "repoRoot", {value: this.repoRoot, enumerable: true, configurable: false, writable: false}); // Make it non-writable and non-configurable to prevent accidental changes

    if (!fsOld.existsSync(this.repoRoot)) {
      fsOld.mkdirSync(this.repoRoot, {recursive: true});
      child_process.execFileSync("git", ["init", "-b", "main"], {cwd: this.repoRoot});
    } else if (!fsOld.existsSync(path.join(this.repoRoot, ".git"))) child_process.execFileSync("git", ["init", "-b", "main"], {cwd: this.repoRoot});

    // Set url
    if (config?.remoteUrl) this.remote("add", {gitUrl: config.remoteUrl}, () => execFile("git", ["pull", "--all", "--rebase"], {cwd: this.repoRoot}));
  }
}
export default git;