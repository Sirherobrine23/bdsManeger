import * as bdsCoretypes from "./globalType";
import os from "os";
import path from "path";
import fs, { promises as fsPromise } from "fs";
import fse from "fs-extra";
import AdmZip from "adm-zip";
import simpleGit from "simple-git";

const ServerPathRoot = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"));
const backupFolderPath = path.resolve(process.env.BACKUP_PATH||path.join(os.homedir(), "bds_core/backups"));

export default CreateBackup;
export async function CreateBackup(Platform: bdsCoretypes.Platform) {
  if (!(fs.existsSync(backupFolderPath))) await fsPromise.mkdir(backupFolderPath, {recursive: true});
  const ServerPath = path.join(ServerPathRoot, Platform);
  if (!(fs.existsSync(ServerPath))) throw new Error("Server no Installed or path not found");
  const Backup = new AdmZip();
  if (Platform === "bedrock") {
    if (fs.existsSync(path.join(ServerPath, "worlds"))) Backup.addLocalFolder(path.join(ServerPath, "worlds"));
    if (fs.existsSync(path.join(ServerPath, "server.properties"))) Backup.addLocalFile(path.join(ServerPath, "server.properties"));
    if (fs.existsSync(path.join(ServerPath, "permissions.json"))) Backup.addLocalFile(path.join(ServerPath, "permissions.json"));
  }
  
  const BackupFile = path.resolve(backupFolderPath, `${Platform}_${new Date().toString().replace(/[-\(\)\:\s+]/gi, "_")}.zip`);
  const zipBuffer = Backup.toBuffer();
  fs.writeFileSync(BackupFile, zipBuffer);
  return {zipBuffer, BackupFile};
}

export type gitBackupOption = {
  /** repository url, it can be https, http or git */
  gitUrl?: string;
  /** push */
  pushCommits?: true|false;
  /** if the repository works with several branches let us know because if not we will use the default. */
  gitBranch?: string;
  /** if the repository needs authentication, you will have to inform it here */
  auth?: {
    /** if the repository is on gitHub provide a token, the username and password will not work on github! */
    githubToken?: string;
    username?: string;
    password?: string;
  };
};

export async function gitBackup(Platform: bdsCoretypes.Platform, options?: gitBackupOption){
  const platformGitPath = path.join(backupFolderPath, "git_"+Platform);
  if (!(fs.existsSync(platformGitPath))) {
    if (!!options) {
      const gitLocal = await simpleGit(platformGitPath);
      if (!!options.gitUrl) {
        if (!/http:\/\/|https:\/\/|git:\/\//.test(options.gitUrl)) throw new Error("Invalid git url");
        if (!!options.gitBranch) {
          if (!!options.auth) {
            if (!!options.auth.githubToken) {
              await gitLocal.addRemote("origin", options.gitUrl, {
                fetch: "+refs/heads/*:refs/remotes/origin/*",
                token: options.auth.githubToken
              });
            } else {
              await gitLocal.addRemote("origin", options.gitUrl, {
                fetch: "+refs/heads/*:refs/remotes/origin/*",
                username: options.auth.username,
                password: options.auth.password
              });
            }
          } else await gitLocal.clone(options.gitUrl, platformGitPath).checkout(options.gitBranch);
        } else await gitLocal.clone(options.gitUrl, platformGitPath);
      } else {
        if (!!options.gitBranch) await gitLocal.init([`--initial-branch=${options.gitBranch}`]);
        else await gitLocal.init(["--initial-branch=main"]);
      }
    }
  }
  const gitLocal = await simpleGit(platformGitPath);
  const serverPath = path.join(ServerPathRoot, Platform);
  const onStorage = path.join(serverPath, Platform);
  if (!(fs.existsSync(onStorage))) await fsPromise.mkdir(onStorage, {recursive: true});
  let commit = false;
  if (Platform === "bedrock"||Platform === "pocketmine") {
    if (fs.existsSync(path.join(serverPath, "worlds"))) {
      if (fs.existsSync(path.join(onStorage, "worlds"))) await fsPromise.rmdir(path.join(onStorage, "worlds"), {recursive: true});
      await fse.copy(path.join(serverPath, "worlds"), path.join(onStorage, "worlds"), {recursive: true});
      await gitLocal.add(["worlds"]);
      commit = true;
    }
    if (fs.existsSync(path.join(serverPath, "server.properties"))) {
      if (fs.existsSync(path.join(onStorage, "server.properties"))) await fsPromise.unlink(path.join(onStorage, "server.properties"));
      await fse.copy(path.join(serverPath, "server.properties"), path.join(onStorage, "server.properties"));
      await gitLocal.add(["server.properties"]);
      commit = true;
    }
    if (fs.existsSync(path.join(serverPath, "permissions.json"))) {
      if (fs.existsSync(path.join(onStorage, "permissions.json"))) await fsPromise.unlink(path.join(onStorage, "permissions.json"));
      await fse.copy(path.join(serverPath, "permissions.json"), path.join(onStorage, "permissions.json"));
      await gitLocal.add(["permissions.json"]);
      commit = true;
    }
  }
  if (commit) await gitLocal.commit(`${Platform} backup - ${(new Date()).toISOString()}`);
  if (!!options&&!!options.pushCommits) await gitLocal.push();
  return;
}