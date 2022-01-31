process.env.ShowLoadTime = true;
const BdsCore = require("../src/index");

const TestInstrucation = [
  async function() {
    console.log("Change Platform to java");
    await BdsCore.BdsSettings.ChangePlatform("java");
  },
  async function() {
    console.log("Change Platform to Bedrock");
    await BdsCore.BdsSettings.ChangePlatform("bedrock");
  },
  async function() {
    console.log("Get Basic system information");
    console.log("Arch:", BdsCore.BdsSystemInfo.arch);
    return await BdsCore.BdsSystemInfo.CheckSystemAsync();
  },
  async function() {
    console.log("Download Server to Current Platform");
    return await BdsCore.BdsDownload.DownloadServer("latest");
  },
  async function() {
    console.log("Get Bds Configs");
    const { BdsDir, CurrentPlatorm, GetBdsConfig, GetPaths, UpdateServerVersion } = BdsCore.BdsSettings;
    console.log("Bds Dir:", BdsDir);
    console.log("Current Platform:", CurrentPlatorm());
    console.log("Get Bds Config:", GetBdsConfig());
    console.log("Get Paths:", GetPaths("all"));
    console.log("Update Server Version:", UpdateServerVersion("1.0.0"));
  },
  () => {
    const Server = BdsCore.BdsManegerServer.StartServer();
    Server.on("log", data => process.stdout.write(data));
    return Server;
  },
  async function(Server) {
    console.log("Stoping Server");
    const Code = await Server.stop();
    if (Code === 0) return Code;
    else throw new Error("Server Stop Error");
  },
  async function() {
    console.log("Get Server Config");
    const ServerConfig = await BdsCore.BdsServerSettings.get_config();
    return ServerConfig;
  }
];

(async () => {
  let OldReturn;
  for (const Action of TestInstrucation) {
    try {
      OldReturn = await Action(OldReturn);
      console.log("Data:", OldReturn);
      console.log("Result: Success\n");
    } catch (err) {
      console.error(err.stack||err);
      console.log("Result: Failed\n");
      process.exit(1);
    }
  }
  process.exit(0);
})()
