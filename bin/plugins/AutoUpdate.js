const BdsCore = require("../../index");

async function Sleep(Seconds = 1) {
  await new Promise(resolve => setTimeout(resolve, Seconds * 1000));
}

module.exports.description = "Auto Update Server Software";
module.exports.externalStart = true;
module.exports.Args = [
  {
    arg: "a",
    main: async () => {
      console.log("Auto Update Server Software Enabled");
      let TmpVersion = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const Versions = await BdsCore.BdsDownload.GetServerVersion();
        if (Versions.latest !== TmpVersion) {
          console.log("New Version:", Versions.latest);
          const Servers = BdsCore.BdsManegerServer.GetSessionsArray()
          for (let session of Servers) {
            try {session.say("AutoUpdate Stop Server");} catch (err) {console.log(err);}
            await session.stop()
          }
          (BdsCore.BdsBackup.Backup()).write_file();
          await BdsCore.BdsDownload.DownloadServer("latest")
          
          require("../BdsManeger").StartServer();
          TmpVersion = Versions.latest;
        }
        await Sleep(1000);
      }
    }
  }
];
module.exports.help = [
  "   -t, --telegram             Start Telegram Bot"
];