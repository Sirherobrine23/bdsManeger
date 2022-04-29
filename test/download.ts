import bdscore from "../src/index";

export default async function download(done: (error?: Error) => void) {
  console.log("Downloading...");
  await bdscore.downloadServer.DownloadServer("bedrock", true).then(data => {
    console.log(data);
    done();
  }).catch(done);
}