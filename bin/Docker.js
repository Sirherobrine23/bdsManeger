#!/usr/bin/env node
process.env.BDS_DOCKER_IMAGE = true;
const fs = require("fs");

const BdsCore = require("../index");
const { GetPlatform } = require("../src/lib/BdsSettings");
const { CronJob } = require("cron");
const { PlatformVersionsV2 } = require("../src/BdsServersDownload");

// Get Current Tokens and Show in the console
function ShowToken() {
  const TokenFilePath = BdsCore.BdsManegerAPI.TokensFilePath;
  let Tokens = 1
  if (fs.existsSync(TokenFilePath)) {
    [...JSON.parse(fs.readFileSync(TokenFilePath, "utf8"))].slice(0, 5).forEach(token => {console.log(Tokens+":", "Bds API Token:", token.token); Tokens++});
  } else {
    console.log(Tokens+":", "Bds API Token:", BdsCore.BdsManegerAPI.token_register());
  }
}

async function CheckAndUpdateServer() {
  const LatestVersion = (await BdsCore.BdsDownload.PlatformVersionsV2()).latest;
  const LocalVersion = BdsCore.BdsSettings.GetServerVersion()[GetPlatform()];
  if (!LocalVersion) {
    console.log("Server is not installed, starting server implementation");
    const __InitInstall = await BdsCore.BdsDownload(true);
    console.log("Installed Version:", __InitInstall.version, `Release Version: ${__InitInstall.data.getDate()}/${__InitInstall.data.getMonth()}/${__InitInstall.data.getFullYear()}`);
  } else if (LocalVersion !== LatestVersion) {
    console.log("Server is out of date, starting server implementation");
    const __UpdateInstall = await BdsCore.BdsDownload(true);
    console.log("Updated Version:", __UpdateInstall.version, `Release Version: ${__UpdateInstall.data.getDate()}/${__UpdateInstall.data.getMonth()}/${__UpdateInstall.data.getFullYear()}`);
  }
  new CronJob("0 */1 * * *", async () => {
    try {
      const CurrentLocalVersion = BdsCore.BdsSettings.GetServerVersion()[GetPlatform()],
        CurrentRemoteVersion = (await PlatformVersionsV2(GetPlatform())).latest;
      if (CurrentLocalVersion !== CurrentRemoteVersion) {
        let currenttime = `Hello we are starting the server upgrade from version ${CurrentLocalVersion} to version ${CurrentRemoteVersion}, you have 20 seconds to exit the server`
        console.log("Update Server:", currenttime);
        ServerStarted.say(currenttime);
        let countdown = 20;
        while (countdown > 1) {
          currenttime = `${countdown} seconds remaining to stop Server!`;
          console.log(currenttime);
          ServerStarted.say(currenttime);
          countdown--;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        currenttime = "Stopping the server"
        console.log(currenttime);
        ServerStarted.say(currenttime);
        await new Promise(resolve => setTimeout(resolve, 600));
        ServerStarted.stop();
      }
    } catch (err) {
      console.log(err);
    }
  });
}

async function StartServer(){
  ShowToken();
  console.log("The entire log can be accessed via the api and/or the docker log");
  const ServerStarted = BdsCore.BdsManegerServer.StartServer();
  ServerStarted.log(a => process.stdout.write(a));
  ServerStarted.exit(code => process.exit(code));
  BdsCore.BdsManegerAPI.api();
  if (process.env.PULL_REQUEST === "true") {
    console.log((require("cli-color")).red("Pull Request Actived 1 Min to exit"));
    setTimeout(() => {
      ServerStarted.stop();
    }, 1 * 60 * 1000)
  }
}

async function RenderCLI(){
  await CheckAndUpdateServer();
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
  await StartServer();
}
RenderCLI();
