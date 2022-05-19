import path from "path";
import fs from "fs";
import os from "os";
import * as httpRequests from "./HttpRequests";
import * as bdsTypes from "./globalType";
import * as platform from "./platform/index";
import * as the_bds_maneger_server_versions from "@the-bds-maneger/server_versions";

export default DownloadServer;
export async function DownloadServer(Platform: bdsTypes.Platform, Version: string|boolean): Promise<{Version: string, Date: Date, url: string}> {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), Platform);
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
    if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    const spigotInfo = await the_bds_maneger_server_versions.findUrlVersion("spigot", Version);
    await fs.promises.writeFile(path.resolve(ServerPath, "Spigot.jar"), await httpRequests.getBuffer(String(spigotInfo.url)));
    await fs.promises.writeFile(path.resolve(ServerPath, "eula.txt"), "eula=true");
    return {
      Version: spigotInfo["version"],
      Date: spigotInfo.datePublish,
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
