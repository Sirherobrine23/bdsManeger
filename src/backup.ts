import os from "os";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

export default CreateBackup;
export async function CreateBackup(Platform: "bedrock"|"java"|"pocketmine"|"spigot"|"dragonfly") {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), Platform);
  const BackupPath = path.resolve(process.env.BACKUP_PATH||path.join(os.homedir(), "bds_core/backups"));
  if (!(fs.existsSync(ServerPath))) throw new Error("Server no Installed or path not found");
  if (!(fs.existsSync(BackupPath))) fs.mkdirSync(BackupPath, {recursive: true});
  const Backup = new AdmZip();
  if (Platform === "bedrock") {
    if (fs.existsSync(path.join(ServerPath, "worlds"))) Backup.addLocalFolder(path.join(ServerPath, "worlds"));
    if (fs.existsSync(path.join(ServerPath, "server.properties"))) Backup.addLocalFile(path.join(ServerPath, "server.properties"));
    if (fs.existsSync(path.join(ServerPath, "permissions.json"))) Backup.addLocalFile(path.join(ServerPath, "permissions.json"));
  }
  
  const BackupFile = path.resolve(BackupPath, `${Platform}_${new Date().toString().replace(/[-\(\)\:\s+]/gi, "_")}.zip`);
  const zipBuffer = Backup.toBuffer();
  fs.writeFileSync(BackupFile, zipBuffer);
  return {zipBuffer, BackupFile};
}