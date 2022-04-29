import * as bdsCoretypes from "./globalType";
import os from "os";
import path from "path";
import fs, { promises as fsPromise } from "fs";
import fse from "fs-extra";
import AdmZip from "adm-zip";
import simpleGit from "simple-git";
import { compare as compareDir } from "dir-compare";

const ServerPathRoot = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"));
export const backupFolderPath = path.resolve(process.env.BACKUP_PATH||path.join(os.homedir(), "bds_core/backups"));

async function createTempFolder() {
  let cleaned = false;
  const tempFolderPath = path.join(os.tmpdir(), Buffer.from(Math.random().toString()).toString("hex")+"tmpFolder");
  if (fs.existsSync(tempFolderPath)) await fse.rm(tempFolderPath, {recursive: true});
  await fsPromise.mkdir(tempFolderPath, { recursive: true });
  
  /**
   * Add file to temp Folder
   * 
   * @param filePath - Original file path
   * @param onStorage - on Storage temp file path, example: serverName/fileName
   * @returns
   */
  const addFile = async (filePath: string, onStorage?: string) => {
    if (cleaned) throw new Error("Cannot add file after cleaning");
    if (onStorage === undefined) onStorage = path.parse(filePath).name;
    const onTempStorage = path.join(tempFolderPath, onStorage);
    const basenameFolder = path.parse(onTempStorage).dir;
    await fsPromise.mkdir(basenameFolder, { recursive: true }).catch(() => undefined);
    await fsPromise.copyFile(filePath, onTempStorage);
    return;
  }

  /**
   * Add folder to temp Folder (include subfolders)
   * 
   * @param folderPath - Original folder path
   * @param onStorage - on Storage temp folder path, example: serverName/folderName
   * @returns
   */
  const addFolder = async (folderPath: string, onStorage: string = path.basename(folderPath)) => {
    if (cleaned) throw new Error("Cannot add folder after cleaning");
    if (!(fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory())) throw new Error(`${folderPath} is not a folder`);
    await fse.copy(folderPath, path.join(tempFolderPath, onStorage), {recursive: true});
    return;
  }

  /**
   * Get only files from temp folder recursively
   * 
   * @returns list files
   */
  const listFiles = async () => {
    if (cleaned) throw new Error("Cannot list files after cleaning");
    const listFolder = async (folderPath: string) => {
      const folderFiles = (await fsPromise.readdir(folderPath)).filter(file => !(file === ".git")).map(file => path.join(folderPath, file));
      for (const file of folderFiles) {
        const FileStats = await fsPromise.lstat(file).catch(() => null);
        if (FileStats === null) {}
        else if (FileStats.isDirectory()) folderFiles.push(...(await listFolder(file)));
        else if (FileStats.isSymbolicLink()){};
      }
      return folderFiles;
    }
    const FilesMaped = (await listFolder(tempFolderPath)).filter(a => !(fs.lstatSync(a).isDirectory())).map(PathF => PathF.replace(tempFolderPath+path.sep, ""));
    return FilesMaped;
  }

  /**
   * Remove temp folder and lock to add new files and folders
   * 
   * @returns 
   */
  const cleanFolder = async () => {
    if (cleaned) throw new Error("Cannot clean folder after cleaning");
    await fse.rm(tempFolderPath, {recursive: true, force: true});
    cleaned = true;
    return;
  }
  return {
    tempFolderPath,
    addFile,
    addFolder,
    listFiles,
    cleanFolder
  };
}

async function genericAddFiles() {
  // Create empty zip Buffer
  const TempFolder = await createTempFolder()
  
  // List all Servers
  for (const __Server_Path of fs.readdirSync(ServerPathRoot).filter(Server => !!bdsCoretypes.PlatformArray.find(Platform => Platform === Server))) {
    const Platform = __Server_Path as bdsCoretypes.Platform;
    const ServerPath = path.join(ServerPathRoot, __Server_Path);
    if (fs.existsSync(ServerPath)) {
      if (fs.existsSync(path.join(ServerPath, "worlds"))) await TempFolder.addFolder(await fsPromise.realpath(path.join(ServerPath, "worlds")), Platform+"/worlds");
      if (fs.existsSync(path.join(ServerPath, "server.properties"))) await TempFolder.addFile(await fsPromise.realpath(path.join(ServerPath, "server.properties")), Platform+"/server.properties");
      if (fs.existsSync(path.join(ServerPath, "permissions.json"))) await TempFolder.addFile(path.join(ServerPath, "permissions.json"), Platform+"/permissions.json");
      if (Platform === "java") {
        if (fs.existsSync(path.join(ServerPath, "banned-ips.json"))) await TempFolder.addFile(path.join(ServerPath, "banned-ips.json"), Platform+"/banned-ips.json");
        if (fs.existsSync(path.join(ServerPath, "banned-players.json"))) await TempFolder.addFile(path.join(ServerPath, "banned-players.json"), Platform+"/banned-players.json");
        if (fs.existsSync(path.join(ServerPath, "whitelist.json"))) await TempFolder.addFile(path.join(ServerPath, "whitelist.json"), Platform+"/whitelist.json");
        // Filter folders
        const Folders = fs.readdirSync(ServerPath).filter(Folder => fs.lstatSync(path.join(ServerPath, Folder)).isDirectory()).filter(a => !(a === "libraries"||a === "logs"||a === "versions"));
        for (const world of Folders) await TempFolder.addFolder(path.join(ServerPath, world), Platform+"/"+world);
      }
    }
  }
  return TempFolder;
}

export type zipOptions = true|false|{path: string};
export default CreateBackup;
export async function CreateBackup(WriteFile: zipOptions = false) {
  if (!(fs.existsSync(backupFolderPath))) await fsPromise.mkdir(backupFolderPath, {recursive: true});
  // Add Folders and files
  const TempFolder = await genericAddFiles()
  // Create empty zip Buffer
  const zip = new AdmZip();
  for (const file of await TempFolder.listFiles()) zip.addLocalFile(path.join(TempFolder.tempFolderPath, file), (path.sep+path.parse(file).dir));
  await TempFolder.cleanFolder();
  // Get Zip Buffer
  const zipBuffer = zip.toBuffer();
  let BackupFile = path.resolve(backupFolderPath, `${new Date().toString().replace(/[-\(\)\:\s+]/gi, "_")}.zip`);
  if (WriteFile === true) await fsPromise.writeFile(BackupFile, zipBuffer);
  else if (typeof WriteFile === "object") {
    if (!!WriteFile.path) BackupFile = path.resolve(WriteFile.path);
    await fsPromise.writeFile(BackupFile, zipBuffer);
  }
  return zipBuffer;
}

export type gitBackupOption = {
  repoUrl: string;
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
