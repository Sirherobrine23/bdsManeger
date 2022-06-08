import * as fsOld from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import admZip from "adm-zip";
import { serverRoot } from '../../pathControl';
const javaPath = path.join(serverRoot, "java");

const filesFoldertoIgnore = [];

/**
 * Create backup for Worlds and Settings
 */
export async function CreateBackup(): Promise<Buffer> {
  if (!(fsOld.existsSync(javaPath))) throw new Error("Install server");
  const filesLint = (await fs.readdir(javaPath)).filter(file => !(filesFoldertoIgnore.some(folder => folder === file)));
  const zip = new admZip();
  for (const file of filesLint) {
    const filePath = path.join(javaPath, file);
    const stats = await fs.stat(filePath);
    if (stats.isSymbolicLink()) {
      const realPath = await fs.realpath(filePath);
      const realStats = await fs.stat(realPath);
      if (realStats.isDirectory()) zip.addLocalFolder(realPath, file);
      else zip.addLocalFile(realPath, file);
    } else if (stats.isDirectory()) zip.addLocalFolder(filePath);
    else zip.addLocalFile(filePath);
  }
  return zip.toBuffer();
}

/**
 * Restore backup for Worlds and Settings
 *
 * WARNING: This will overwrite existing files and World folder files
 */
export async function RestoreBackup(zipBuffer: Buffer): Promise<void> {
  const zip = new admZip(zipBuffer);
  await new Promise((resolve, reject) => zip.extractAllToAsync(javaPath, true, true, (err) => !!err ? reject(err) : resolve("")));
  return;
}