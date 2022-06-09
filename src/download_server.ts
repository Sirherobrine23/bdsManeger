import * as bdsTypes from "./globalType";
import platform from "./platform/index";

export default DownloadServer;
export async function DownloadServer(Platform: bdsTypes.Platform, Version: string|boolean): Promise<{version: string, url: string; publishDate: Date}> {
  if (Platform === "bedrock") return platform.bedrock.DownloadServer(Version);
  else if (Platform === "java") return platform.java.DownloadServer(Version);
  else if (Platform === "spigot") return platform.spigot.DownloadServer(Version);
  else if (Platform === "pocketmine") return platform.pocketmine.DownloadServer(Version);
  throw new Error("Invalid Platform");
}
