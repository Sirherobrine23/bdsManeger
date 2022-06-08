import * as bedrock from "./bedrock/index";
import * as pocketmine from "./pocketmine/index";
import * as java from "./java/index";
import * as spigot from "./spigot/index";
import { BdsSession } from "../globalType";

type globalPlatform = {
  [platform: string]: {
    /**
     * Download Server (and ¹auto install).
     *
     * 1: **In java server required java installation (if not installed, it will install it)**
     */
    DownloadServer: (version: string|boolean) => Promise<{version: string, publishDate: Date, url: string}>,
    server: {
      /** get server session */
      startServer: () => Promise<BdsSession>,
      /** Get all Server Sessions */
      getSessions: () => {[sessionId: string]: BdsSession}
    },
    backup: {
      /** Create Platform Backup, and return Buffer zip File */
      CreateBackup: () => Promise<Buffer>,
      /** Restore Zip Backup, this option replace local files */
      RestoreBackup: (buffer: Buffer) => Promise<void>,
    },
  }
};

export default {bedrock, java, pocketmine, spigot} as globalPlatform;