import os from "os";
import path from "node:path";
import fs, { promises as fsPromise } from "node:fs";
import fse from "fs-extra";
import * as bdsCoretypes from "../globalType";
import { serverRoot as ServerPathRoot } from "../pathControl";

export async function createTempFolder() {
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

export async function genericAddFiles() {
  if (!(fs.existsSync(ServerPathRoot))) throw new Error("Install server first");
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