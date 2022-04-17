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
  const tempFolderPath = path.join(os.tmpdir(), Buffer.from(Math.random().toString()).toString("hex")+"tmpFolder");
  if (fs.existsSync(tempFolderPath)) await fse.rm(tempFolderPath, {recursive: true});
  fsPromise.mkdir(tempFolderPath, { recursive: true });
  const addFile = (filePath: string, onStorage: string = path.basename(filePath)) => fsPromise.copyFile(filePath, path.join(tempFolderPath, onStorage));
  const addFolder = (folderPath: string, onStorage: string = path.basename(folderPath)) => {
    if (!(fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory())) throw new Error(`${folderPath} is not a folder`);
    return fse.copy(folderPath, path.join(tempFolderPath, onStorage), {recursive: true});
  }

  const listFiles = async () => {
    let files = await fsPromise.readdir(tempFolderPath);
    const listFolder = async (folderPath: string) => {
      const folderFiles = await fsPromise.readdir(folderPath);
      for (const file of folderFiles) {
        const filePath = path.join(folderPath, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          folderFiles.push(...(await listFolder(filePath)).map(f => path.join(folderPath, f)));
        }
      }
      return folderFiles;
    }
    for (const folder of files) {
      const folderPath = path.join(tempFolderPath, folder);
      if (fs.lstatSync(folderPath).isDirectory()) {
        files = files.concat((await listFolder(folderPath)));
      }
    }
    return files.map(PathF => PathF.replace(tempFolderPath+path.sep, ""));
  }

  return {
    addFile,
    addFolder,
    listFiles
  };
}

export default CreateBackup;
export async function CreateBackup(WriteFile: {path: string}|true|false = false) {
  if (!(fs.existsSync(backupFolderPath))) await fsPromise.mkdir(backupFolderPath, {recursive: true});
  // Create empty zip Buffer
  const BackupZip = new AdmZip();
  
  // List all Servers
  for (const __Server_Path of fs.readdirSync(ServerPathRoot).filter(Server => !!bdsCoretypes.PlatformArray.find(Platform => Platform === Server))) {
    const Platform = __Server_Path as bdsCoretypes.Platform;
    const ServerPath = path.join(ServerPathRoot, __Server_Path);
    if (fs.existsSync(ServerPath)) {
      if (fs.existsSync(path.join(ServerPath, "worlds"))) BackupZip.addLocalFolder(await fsPromise.realpath(path.join(ServerPath, "worlds")), Platform+"/worlds");
      if (fs.existsSync(path.join(ServerPath, "server.properties"))) BackupZip.addLocalFile(await fsPromise.realpath(path.join(ServerPath, "server.properties")), Platform+"/server.properties");
      if (fs.existsSync(path.join(ServerPath, "permissions.json"))) BackupZip.addLocalFile(path.join(ServerPath, "permissions.json"), Platform+"/permissions.json");
      if (Platform === "java") {
        if (fs.existsSync(path.join(ServerPath, "banned-ips.json"))) BackupZip.addLocalFile(path.join(ServerPath, "banned-ips.json"), Platform+"/banned-ips.json");
        if (fs.existsSync(path.join(ServerPath, "banned-players.json"))) BackupZip.addLocalFile(path.join(ServerPath, "banned-players.json"), Platform+"/banned-players.json");
        if (fs.existsSync(path.join(ServerPath, "whitelist.json"))) BackupZip.addLocalFile(path.join(ServerPath, "whitelist.json"), Platform+"/whitelist.json");
        // Filter folders
        const Folders = fs.readdirSync(ServerPath).filter(Folder => fs.lstatSync(path.join(ServerPath, Folder)).isDirectory()).filter(a => !(a === "libraries"||a === "logs"||a === "versions"));
        for (const world of Folders) BackupZip.addLocalFolder(path.join(ServerPath, world), Platform+"/"+world);
      }
    }
  }

  // Get Zip Buffer
  const zipBuffer = BackupZip.toBuffer();
  if (typeof WriteFile === "object") {
    let BackupFile = path.resolve(backupFolderPath, `${new Date().toString().replace(/[-\(\)\:\s+]/gi, "_")}.zip`);
    if (!!WriteFile.path) BackupFile = path.resolve(WriteFile.path);
    fs.writeFileSync(BackupFile, zipBuffer);
  }
  return zipBuffer;
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
