import path from "node:path";
import fs, { promises as fsPromise } from "node:fs";
import AdmZip from "adm-zip";
import { backupRoot as backupFolderPath } from "../pathControl";
import { genericAddFiles } from "./root";


export type zipOptions = true|false|{path: string};
export async function createZipBackup(WriteFile: zipOptions = false) {
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