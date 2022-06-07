import * as bedrock from "./bedrock/index";
import * as pocketmine from "./pocketmine/index";
import * as java from "./java/index";
import * as spigot from "./spigot/index";

type globalPlatform = {
  [platform: string]: {
    DownloadServer: (version: string) => Promise<{version: string, publishDate: Date, url: string}>,
    backup: {
      CreateBackup: () => Promise<Buffer>,
    }
  }
};

bedrock.backup.CreateBackup

const platforms: globalPlatform = {
  bedrock,
  pocketmine,
  java,
  spigot
}
export default platforms