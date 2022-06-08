import * as bdsTypes from "./globalType";
import platform from "./platform/index";

export default DownloadServer;
export async function DownloadServer(Platform: bdsTypes.Platform, Version: string|boolean): Promise<{Version: string, Date: Date, url: string}> {
  if (Platform === "bedrock") {
    const bedrockInfo = await platform.bedrock.DownloadServer(Version);
    return {
      Version: bedrockInfo.version,
      Date: bedrockInfo.publishDate,
      url: bedrockInfo.url
    };
  } else if (Platform === "java") {
    const javaInfo = await platform.java.DownloadServer(Version);
    return {
      Version: javaInfo.version,
      Date: javaInfo.publishDate,
      url: javaInfo.url
    };
  } else if (Platform === "spigot") {
    const spigotInfo = await platform.spigot.DownloadServer(Version);
    return {
      Version: spigotInfo.version,
      Date: spigotInfo.publishDate,
      url: spigotInfo.url
    };
  } else if (Platform === "pocketmine") {
    const pocketmineInfo = await platform.pocketmine.DownloadServer(Version);
    return {
      Version: pocketmineInfo.version,
      Date: pocketmineInfo.publishDate,
      url: pocketmineInfo.url
    };
  }
  throw new Error("No file found for this Platform and Arch");
}
