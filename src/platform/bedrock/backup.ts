import {promises as fsPromise, existsSync as fsExists} from "node:fs";
import * as path from "node:path";
import admZip from "adm-zip";
import { serverRoot } from "../../pathControl";

const bedrockPath = path.join(serverRoot, "bedrock");
/**
 * Create backup for Worlds and Settings
 */
export async function CreateBackup(): Promise<Buffer> {
  if (!(fsExists(bedrockPath))) throw new Error("Bedrock folder does not exist");
  const zip = new admZip();
  const FFs = (await fsPromise.readdir(bedrockPath)).filter(FF => (["allowlist.json", "permissions.json", "server.properties", "worlds"]).some(file => file === FF));
  for (const FF of FFs) {
    const FFpath = path.join(bedrockPath, FF);
    const stats = await fsPromise.stat(FFpath);
    if (stats.isSymbolicLink()) {
      const realPath = await fsPromise.realpath(FFpath);
      const realStats = await fsPromise.stat(realPath);
      if (realStats.isDirectory()) zip.addLocalFolder(realPath, FF);
      else zip.addLocalFile(realPath, FF);
    } else if (stats.isDirectory()) zip.addLocalFolder(FFpath);
    else zip.addLocalFile(FFpath);
  }
  // Return Buffer
  return zip.toBufferPromise();
}

/**
 * Restore backup for Worlds and Settings
 *
 * WARNING: This will overwrite existing files and World folder files
 */
export async function RestoreBackup(zipBuffer: Buffer): Promise<void> {
  const zip = new admZip(zipBuffer);
  await new Promise((resolve, reject) => zip.extractAllToAsync(bedrockPath, true, true, (err) => !!err ? reject(err) : resolve("")));
  return;
}