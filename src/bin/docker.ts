import * as BdsCore from "../index";
import * as BdsTypes from "../globalType";

const {
  VERSION = "latest",
  PLATFORM = "bedrock",
  DESCRIPTION = "My Sample Server",
  WORLD_NAME = "My Map",
  GAMEMODE = "survival",
  DIFFICULTY = "normal",
  MAXPLAYERS = "5",
  REQUIRED_LOGIN = "false",
  ALLOW_COMMADS = "false",
} = process.env;

(async () => {
  if (VERSION === "latest") {
    await BdsCore.DownloadServer.DownloadServer(PLATFORM as BdsTypes.Platform, true);
  } else if (VERSION !== "latest") {
    await BdsCore.DownloadServer.DownloadServer(PLATFORM as BdsTypes.Platform, VERSION);
  } else {
    console.log("Invalid Version");
  }
  const Server = await BdsCore.Server.Start(PLATFORM as BdsTypes.Platform);
  Server.on("all", data => process.stdout.write(data));
  Server.exit(process.exit);
  
})();