#!/usr/bin/env node
import * as bdscoreVersion from "@the-bds-maneger/server_versions";
import { CronJob } from "cron";
import * as BdsTypes from "../globalType";
import * as BdsCore from "../index";
import expressApp from "./apiBase";

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
  } else console.log("Invalid Version");

  await BdsCore.serverConfig.createConfig(PLATFORM, {
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

  // Run
  let sessionStart = await start();
  if (VERSION === "latest") {
    console.log("Auto Update enabled");
    const cronUpdate = new CronJob("0 */1 * * * *", async () => {
      const DownloadInfo = await bdscoreVersion.findUrlVersion(PLATFORM, true);
      if (DownloadInfo.version === versionDownloaded) return;
      lockExit = true;
      await sessionStart.stop();
      await BdsCore.DownloadServer.DownloadServer(PLATFORM, true);
      sessionStart = await start();
    });
    cronUpdate.start();
  };
  expressApp.listen(3000, () => console.log("API listening on port 3000"));
  expressApp.get("/", ({res}) => res.json({
    port: sessionStart.ports(),
    seed: sessionStart.seed,
    startDate: sessionStart.startDate
  }));
  expressApp.post("/command", (req, res) => {sessionStart.commands.execCommand(req.body.command); return res.sendStatus(200)});
  expressApp.get("/players", ({res}) => res.json(sessionStart.getPlayer()));
})();