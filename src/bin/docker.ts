#!/usr/bin/env node
import * as BdsCore from "../index";
import * as BdsTypes from "../globalType";
import { CronJob } from "cron";

const PLATFORM = (process.env.PLATFORM||"bedrock") as BdsTypes.Platform;
const {
  VERSION = "latest",
  DESCRIPTION = "My Sample Server",
  WORLD_NAME = "My Map",
  GAMEMODE = "survival",
  DIFFICULTY = "normal",
  MAXPLAYERS = "5",
  REQUIRED_LOGIN = "false",
  ALLOW_COMMADS = "false",
} = process.env;

if (!BdsTypes.PlatformArray.find(p => p === PLATFORM)) {
  console.error(`Platform ${PLATFORM} is not supported.`);
  process.exit(1);
}

(async () => {
  let versionDownloaded = "";
  if (VERSION === "latest") {
    const DownloadRes = await BdsCore.DownloadServer.DownloadServer(PLATFORM, true);
    versionDownloaded = DownloadRes.Version;
  } else if (VERSION !== "latest") {
    await BdsCore.DownloadServer.DownloadServer(PLATFORM, VERSION);
  } else {
    console.log("Invalid Version");
  }

  BdsCore.serverConfig.createConfig(PLATFORM, {
    description: DESCRIPTION,
    world: WORLD_NAME,
    gamemode: GAMEMODE as any,
    difficulty: DIFFICULTY as any,
    players: parseInt(MAXPLAYERS),
    require_login: REQUIRED_LOGIN === "true",
    cheats_command: ALLOW_COMMADS === "true"
  });
  BdsCore.API.listen(3000);
  let lockExit = false;
  const start = async () => {
    const Server = await BdsCore.Server.Start(PLATFORM, {
      storageOnlyWorlds: true
    });
    Server.logRegister("all", data => console.log(data));
    process.on("SIGTERM", () => Server.stop());
    Server.onExit(code => {
      if (lockExit) return;
      process.exit(code);
    });
    return Server;
  };
  if (VERSION === "latest") {
    console.log("Auto Update enabled");
    let sessionStart = await start();
    const cronUpdate = new CronJob("0 */1 * * * *", async () => {
      const DownloadInfo = await BdsCore.DownloadServer.getVersions();
      if (DownloadInfo.latest[PLATFORM] === versionDownloaded) return;
      lockExit = true;
      await sessionStart.stop();
      await BdsCore.DownloadServer.DownloadServer(PLATFORM, true);
      sessionStart = await start();
    });
    cronUpdate.start();
  } else await start();
})();