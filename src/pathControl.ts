import * as os from "node:os";
import * as path from "node:path";

const bdsCorePathHome = path.join(os.homedir(), "bds_core");
export const serverRoot = (!!process.env.SERVER_PATH) ? path.resolve(process.env.SERVER_PATH) : path.join(bdsCorePathHome, "servers");
export const backupRoot = (!!process.env.BACKUP_PATH) ? path.resolve(process.env.BACKUP_PATH) : path.join(bdsCorePathHome, "backups");
export const worldStorageRoot = (!!process.env.WORLD_STORAGE) ? path.resolve(process.env.WORLD_STORAGE) : path.join(bdsCorePathHome, "worlds");