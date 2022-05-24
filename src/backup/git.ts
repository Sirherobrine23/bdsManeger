import path from "node:path";
import fs, { promises as fsPromise } from "node:fs";
import simpleGit from "simple-git";
import { compare as compareDir } from "dir-compare";
import { backupRoot as backupFolderPath } from "../pathControl";
import { genericAddFiles } from "./root";

export type gitBackupOption = {
  repoUrl?: string;
  branch?: string;
  Auth?: {
    Username?: string;
    PasswordToken: string
  }
};

async function initGitRepo(RepoPath: string, options?: gitBackupOption): Promise<void> {
  if (fs.existsSync(RepoPath)) {
    if (fs.existsSync(path.join(RepoPath, ".git"))) {
      if (!(!!options?.Auth?.Username || !!options?.Auth?.PasswordToken)) return;
      // remove old origin
      const gitRe = simpleGit(RepoPath);
      const urlParsed = new URL(options?.repoUrl);
      const remotes = await gitRe.getRemotes(true);
      let gitUrl = options.repoUrl;
      if (options?.Auth?.Username || options?.Auth?.PasswordToken) {
        if (options.Auth?.Username && options.Auth?.PasswordToken) {
          if (options.Auth?.PasswordToken.startsWith("ghp_")) options.Auth.Username = "oauth2";
          const urlParse = new URL(gitUrl);
          gitUrl = `${urlParse.protocol}//${options.Auth.Username}:${options.Auth.PasswordToken}@${urlParse.host}${urlParse.pathname}`;
        }
      }
      for (const remote of remotes) {
        if (remote.refs.fetch.includes(urlParsed.hostname) && remote.refs.push.includes(urlParsed.hostname)) {
          await gitRe.removeRemote(remote.name);
          await gitRe.addRemote(remote.name, gitUrl);
        }
      }
    }
  }
  await fsPromise.mkdir(RepoPath, {recursive: true});
  if (options) {
    if (options.repoUrl) {
      let gitUrl = options.repoUrl;
      if (options?.Auth?.Username || options?.Auth?.PasswordToken) {
        if (options.Auth?.Username && options.Auth?.PasswordToken) {
          if (options.Auth?.PasswordToken.startsWith("ghp_")) options.Auth.Username = "oauth2";
          const urlParse = new URL(gitUrl);
          gitUrl = `${urlParse.protocol}//${options.Auth.Username}:${options.Auth.PasswordToken}@${urlParse.host}${urlParse.pathname}`;
        }
      }
      const gitClone = simpleGit(RepoPath);
      await gitClone.clone(gitUrl, RepoPath);
      if (options.branch) await gitClone.checkout(options.branch);
    } else {
      console.log("No Repo Url, creating empty repo");
      await initGitRepo(RepoPath);
      return;
    }
  } else {
    // Create empty git repo and create main branch
    const gitInit = simpleGit(RepoPath);
    await gitInit.init()
    // Create main branch
    await gitInit.checkoutBranch("main", "master");
  }
  const git = simpleGit(RepoPath);
  if (!!(await git.getConfig("user.email"))) await git.addConfig("user.email", "support_bds@sirherobrine23.org");
  if (!!(await git.getConfig("user.name"))) await git.addConfig("user.name", "BDS-Backup");
  return;
}

/**
 * Create a backup in the git repository and push it to the remote if is authenticated (in each commit all existing files will be deleted).
 *
 * @param options - Config git repository
 */
export async function gitBackup(options?: gitBackupOption): Promise<void>{
  const gitFolder = path.join(backupFolderPath, "gitBackup");
  await initGitRepo(gitFolder, options);
  const TempFiles = await genericAddFiles();
  const git = simpleGit(gitFolder, {baseDir: gitFolder});
  await git.stash();
  await git.pull();
  const Difff = (await compareDir(TempFiles.tempFolderPath, gitFolder, {excludeFilter: ".git"})).diffSet.filter(a => a.type1 === "missing"||a.type2 === "missing").filter(a => a.type1 === "file"||a.type2 === "file");
  await Promise.all(Difff.map(async file => {
    // Delete files
    const FileDelete = path.join(file.path2, file.name2);
    await fsPromise.rm(FileDelete, {force: true});
  }));
  await Promise.all((await TempFiles.listFiles()).map(async file => {
    const gitPath = path.join(gitFolder, file);
    const tempFolderPath = path.join(TempFiles.tempFolderPath, file);
    if (!(fs.existsSync(path.join(gitFolder, path.parse(file).dir)))) await fsPromise.mkdir(path.join(gitFolder, path.parse(file).dir), {recursive: true}).catch(() => {});
    await fsPromise.copyFile(tempFolderPath, gitPath);
  }))
  await TempFiles.cleanFolder();
  await git.add(gitFolder).then(() => git.commit(`BDS Backup - ${new Date()}`).catch(console.error));
  if (!!((options||{}).Auth||{}).Username) {
    console.log("Pushing to remote");
    await git.push([
      "--force",
      "--set-upstream"
    ]);
  }
  return;
}
