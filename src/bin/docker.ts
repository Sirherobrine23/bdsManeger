import * as BdsCore from "../index";
import * as BdsTypes from "../globalType";
import { CronJob } from "cron";

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

if (!BdsTypes.PlatformArray.find(p => p === PLATFORM)) {
  console.error(`Platform ${PLATFORM} is not supported.`);
  process.exit(1);
}

(async () => {
  let versionDownloaded = "";
  if (VERSION === "latest") {
    const DownloadRes = await BdsCore.DownloadServer.DownloadServer(PLATFORM as BdsTypes.Platform, true);
    versionDownloaded = DownloadRes.Version;
  } else if (VERSION !== "latest") {
    await BdsCore.DownloadServer.DownloadServer(PLATFORM as BdsTypes.Platform, VERSION);
  } else {
    console.log("Invalid Version");
  }

  BdsCore.serverConfig.createConfig(PLATFORM as BdsTypes.Platform, {
    description: DESCRIPTION,
    world: WORLD_NAME,
    gamemode: GAMEMODE as any,
    difficulty: DIFFICULTY as any,
    players: parseInt(MAXPLAYERS),
    require_login: REQUIRED_LOGIN === "true",
    cheats_command: ALLOW_COMMADS === "true"
  });

  let lockExit = false;
  const start = async () => {
    const Server = await BdsCore.Server.Start(PLATFORM as BdsTypes.Platform);
    Server.on("all", data => process.stdout.write(data));
    Server.exit(code => {
      if (lockExit) return;
      process.exit(code);
    });
    return Server;
  };
  if (VERSION === "latest") {
    let sessionStart = await start();
    const cronUpdate = new CronJob("0 */1 * * * *", async () => {
      const DownloadInfo = await BdsCore.DownloadServer.getVersions();
      if (DownloadInfo.latest[PLATFORM as BdsTypes.Platform] === versionDownloaded) return;
      lockExit = true;
      await sessionStart.commands.stop();
      await BdsCore.DownloadServer.DownloadServer(PLATFORM as BdsTypes.Platform, true);
      sessionStart = await start();
    });
    cronUpdate.start();
  } else await start();
})();