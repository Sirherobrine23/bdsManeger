#!/usr/bin/env node
process.env.BDS_DOCKER_IMAGE = true;
const fs = require("fs");
const BdsCore = require("../index");
const { CronJob } = require("cron");

async function UpdateInstallServer(OldServerRunner) {
  if (process.env.SERVER_VERSION === "true") {
    if (typeof OldServerRunner === "function") {
      OldServerRunner.stop();
    }
      const BackupBds = BdsCore.BdsBackup.CreateBackup();
      const ServerDownloadResult = await BdsCore.BdsDownload("latest");
      if (!ServerDownloadResult.skip) {
        console.log("Server Update Sucess, Version:", ServerDownloadResult.version);
        return StartServer();
      }
    } else {
      await BdsCore.BdsDownload(process.env.SERVER_VERSION);
    }
}

function StartServer() {
  let IsUpdate = false;
  const Server = BdsCore.BdsManegerServer.StartServer();
  Server.on("log", data => process.stdout.write(data));
  Server.on("exit", code => {
    if (!IsUpdate) process.exit(code);
  });
  new CronJob("*/1 * * * *", async () => {
    console.log("Checking for updates...");
    await UpdateInstallServer(Server);
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
