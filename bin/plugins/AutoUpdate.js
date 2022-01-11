const { Yargs } = require("../BdsManeger");
const BdsCore = require("../../src/index");
const BdsCoreUrlManeger = require("@the-bds-maneger/server_versions");
async function Sleep(Seconds = 1) {
  await new Promise(resolve => setTimeout(resolve, Seconds * 1000));
}
module.exports.externalStart = false;
const { StartServer } = require("../BdsManeger");
Yargs.option("auto_update", {
  describe: "Enable Auto Update Server",
  alias: "a",
  type: "boolean",
  default: false
});

if (Yargs.parse()["auto_update"]) (async () => {
  module.exports.externalStart = true;
  console.log("Auto Update Server Software Enabled");
  const Platform = BdsCore.BdsSettings.CurrentPlatorm();
  let TmpVersion = BdsCore.BdsSettings.GetBdsConfig().server.versions[Platform];
  let IsFistStart = false;
  StartServer(false);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (IsFistStart) {
        const LatestVersions = (await BdsCoreUrlManeger.listAsync()).latest[Platform];
        if (LatestVersions !== TmpVersion) {
          console.log("New Version:", LatestVersions);
          const Servers = BdsCore.BdsManegerServer.GetSessionsArray()
          for (let session of Servers) {
            try {session.say("AutoUpdate Stop Server");} catch (err) {console.log(err);}
            await session.stop();
          }
          (BdsCore.BdsBackup.Backup()).write_file();
          await BdsCore.BdsDownload.DownloadServer("latest")
          
          StartServer(false);
          TmpVersion = LatestVersions;
        }
      } else IsFistStart = true;
      await Sleep(1000);
    } catch (err) {
      console.log(err);
    }
  }
})();