#!/usr/bin/env node
process.env.BDS_DOCKER_IMAGE = true;
const BdsCore = require("../index");
const { CronJob } = require("cron");

async function UpdateInstallServer(OldServerRunner, pre_stop = () => {}) {
  if (process.env.SERVER_VERSION === "true") {
    if (typeof pre_stop === "function") await pre_stop();
    if (typeof OldServerRunner === "function") {
      OldServerRunner.stop();
    }
    // Create Backup and Write
    (BdsCore.BdsBackup.CreateBackup()).write_file()
    const ServerDownloadResult = await BdsCore.BdsDownload("latest");
    if (ServerDownloadResult.skip) {
      console.log("Server Update Sucess, Version:", ServerDownloadResult.version);
    }
    return StartServer();
  } else {
    await BdsCore.BdsDownload(process.env.SERVER_VERSION);
  }
}

function StartServer() {
  let IsUpdate = false;
  const Server = BdsCore.BdsManegerServer.StartServer();
  Server.on("log", data => {
    if (process.env.PULLIMAGE) {
      const { value: DataToTest, regex: IsRegex } = BdsCore.ExtraJSON.Extra.StartedServer[BdsCore.BdsSettings.GetPlatform()];
      if (IsRegex) {
        if (RegExp(DataToTest, "gi").test(data)) {
          return Server.stop();
        }
      } else return Server.stop();
    }
    return process.stdout.write(data)
  });
  Server.on("exit", code => {
    if (!IsUpdate) process.exit(code);
  });
  new CronJob("*/1 * * * *", async () => {
    console.log("Checking for updates...");
    await UpdateInstallServer(Server, () => IsUpdate = true);
  });
}

function WriteServerConfig() {
  const { DESCRIPTION, WORLD_NAME, GAMEMODE, DIFFICULTY, ACCOUNT, PLAYERS, SERVER, ENABLE_COMMANDS } = process.env;
  BdsCore.BdsSettings.UpdatePlatform(SERVER || "bedrock");
  const ServerConfig = {
    world: WORLD_NAME,
    description: DESCRIPTION,
    gamemode: GAMEMODE,
    difficulty: DIFFICULTY,
    players: parseInt(PLAYERS),
    commands: ENABLE_COMMANDS === "true",
    account: ACCOUNT === "true",
    whitelist: false,
    port: 19132,
    portv6: 19133,
  }
  BdsCore.BdsServerSettings.config(ServerConfig);
}

(async () =>  {
  WriteServerConfig();
  await UpdateInstallServer();
  StartServer();
})();
