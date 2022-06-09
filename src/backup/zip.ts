import fs, { promises as fsPromise } from "node:fs";
import { backupRoot as backupFolderPath } from "../pathControl";
import platforms from "../platform/index";
import AdmZip from "adm-zip";

export type zipOptions = true|false|{path: string};
export async function createZipBackup(options: zipOptions) {
  if (!(fs.existsSync(backupFolderPath))) await fsPromise.mkdir(backupFolderPath, {recursive: true});
  const zip = new AdmZip();
  zip.addFile("bedrock.zip", await platforms.bedrock.backup.CreateBackup());
  zip.addFile("java.zip", await platforms.java.backup.CreateBackup());
  zip.addFile("pocketmine.zip", await platforms.pocketmine.backup.CreateBackup());
  zip.addFile("spigot.zip", await platforms.spigot.backup.CreateBackup());
  if (typeof options === "boolean") return zip.toBuffer();
  else {
    const filePath = options?.path;
    if (!filePath) throw new Error("No file path provided");
    await fsPromise.writeFile(filePath, zip.toBuffer());
    return filePath;
  }
}