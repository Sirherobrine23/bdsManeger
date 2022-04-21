import * as bdsCoretypes from "./globalType";
import os from "os";
import path from "path";
import fs, { promises as fsPromise } from "fs";
import fse from "fs-extra";
import AdmZip from "adm-zip";
import simpleGit from "simple-git";

const ServerPathRoot = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"));
const backupFolderPath = path.resolve(process.env.BACKUP_PATH||path.join(os.homedir(), "bds_core/backups"));

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

export default CreateBackup;
export async function CreateBackup(WriteFile: {path: string}|true|false = false) {
  if (!(fs.existsSync(backupFolderPath))) await fsPromise.mkdir(backupFolderPath, {recursive: true});
  // Add Folders and files
  const TempFolder = await genericAddFiles()
  // Create empty zip Buffer
  const zip = new AdmZip();
  for (const file of await TempFolder.listFiles()) zip.addLocalFile(path.join(TempFolder.tempFolderPath, file), (path.sep+path.parse(file).dir));
  await TempFolder.cleanFolder();
  // Get Zip Buffer
  const zipBuffer = zip.toBuffer();
  if (typeof WriteFile === "object") {
    let BackupFile = path.resolve(backupFolderPath, `${new Date().toString().replace(/[-\(\)\:\s+]/gi, "_")}.zip`);
    if (!!WriteFile.path) BackupFile = path.resolve(WriteFile.path);
    fs.writeFileSync(BackupFile, zipBuffer);
  }
  return zipBuffer;
}

export type gitBackupOption = {
  repoUrl: string;
  Auth?: {
    Username?: string;
    PasswordToken: string
  }
};


async function initGitRepo(RepoPath: string, options?: gitBackupOption): Promise<void> {
  if (fs.existsSync(RepoPath)) {
    if (fs.existsSync(path.join(RepoPath, ".git"))) await fsPromise.rmdir(RepoPath, {recursive: true});
  }
  await fsPromise.mkdir(RepoPath, {recursive: true});
  if (!!options) {
    if (!options.repoUrl) throw new Error("RepoUrl is required");
    let gitUrl = options.repoUrl;
    const { host, pathname, protocol } = new URL(options.repoUrl);
    if (!!options.Auth) {
      if (!!options.Auth.Username) gitUrl = `${protocol}//${options.Auth.Username}:${options.Auth.PasswordToken}@${host}${pathname}`;
      else gitUrl = `${protocol}//${options.Auth.PasswordToken}@${host}${pathname}`;
    }
    const gitClone = simpleGit(RepoPath);
    await gitClone.clone(gitUrl, RepoPath);
    if (!!(await gitClone.getConfig("user.name").catch(() => {}))) await gitClone.addConfig("user.name", "BDS-Backup");
    if (!!(await gitClone.getConfig("user.email").catch(() => {}))) await gitClone.addConfig("user.email", "support_bds@sirherobrine23.org");
    return;
  }
  // Create empty git repo and create main branch
  const gitInit = simpleGit(RepoPath);
  await gitInit.init()
  if (!!(await gitInit.getConfig("user.name").catch(() => {}))) await gitInit.addConfig("user.name", "BDS-Backup");
  if (!!(await gitInit.getConfig("user.email").catch(() => {}))) await gitInit.addConfig("user.email", "support_bds@sirherobrine23.org");
  await gitInit.checkout("main", ["-b", "main"]);
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
  const Files = await genericAddFiles();
  const filesGit = (await fsPromise.readdir(gitFolder)).filter(a => a !== ".git");
  for (const file of filesGit) await fsPromise.rm(path.join(gitFolder, file), {recursive: true, force: true}).catch(err => console.log(err));
  for (const file of await Files.listFiles()) {
    await fsPromise.mkdir(path.join(gitFolder, path.parse(file).dir), {recursive: true}).catch(() => {});
    await fsPromise.copyFile(path.join(Files.tempFolderPath, file), path.join(gitFolder, file));
  }
  await Files.cleanFolder();
  const git = simpleGit(gitFolder);
  await git.stash().pull().catch(() => {});
  if ((await (await git.status()).files.length > 0)) {
    await simpleGit(gitFolder).add(".");
    await simpleGit(gitFolder).commit(`BDS Backup - ${new Date().toString()}`);
  }
  if (!!((options||{}).Auth||{}).Username) await git.push([
    "--force",
    "--set-upstream",
    "--progress"
  ]);
  return;
}
