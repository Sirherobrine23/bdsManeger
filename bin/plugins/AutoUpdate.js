const BdsCore = require("../../index");

async function Sleep(Seconds = 1) {
  await new Promise(resolve => setTimeout(resolve, Seconds * 1000));
}

const BdsCoreUrlManeger = require("@the-bds-maneger/server_versions");

module.exports.description = "Auto Update Server Software";
module.exports.externalStart = true;
module.exports.Args = [
  {
    arg: "a",
    main: async () => {
      console.log("Auto Update Server Software Enabled");
      const Platform = BdsCore.BdsSettings.GetPlatform();
      let TmpVersion = BdsCore.BdsSettings.GetServerVersion()[Platform];
      let IsFistStart = false;
      require("../BdsManeger").StartServer();
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
              
              require("../BdsManeger").StartServer();
              TmpVersion = LatestVersions;
            }
          } else IsFistStart = true;
          await Sleep(1000);
        } catch (err) {
          console.log(err);
        }
      }
    }
  }
];
module.exports.help = [
  "   -t, --telegram             Start Telegram Bot"
];