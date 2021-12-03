#!/usr/bin/env node
process.env.BDS_DOCKER_IMAGE = true;
const fs = require("fs");
const BdsCore = require("../index");
const { CronJob } = require("cron");

async function UpdateInstallServer(OldServerRunner) {
  if (process.env.UPDATE_SERVER === "true") {
    if (typeof OldServerRunner === "function") {
      OldServerRunner.stop();
    }
      const BackupBds = BdsCore.Bdsbackup.CreateBackup();
      const ServerDownloadResult = await BdsCore.BdsDownload("latest");
      if (!ServerDownloadResult.skip) {
        console.log("Server Update Sucess, Version:", ServerDownloadResult.version);
        return StartServer();
      }
    }
}

function StartServer() {
  let IsUpdate = false;
  const Server = BdsCore.BdsManagerServer.StartServer();
  Server.on("log", data => process.stdout.write(data));
  Server.on("exit", code => {
    if (!IsUpdate) process.exit(code);
  });
  new CronJob("*/1 * * * *", async () => {
    console.log("Checking for updates...");
    await UpdateInstallServer(Server);
  });
}

function InitDockerConfig() {}
