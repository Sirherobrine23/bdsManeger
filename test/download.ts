import * as downloads from "../src/download_server";

export default async function download(done: (error?: Error) => void) {
  console.log("Downloading...");
  await downloads.DownloadServer("bedrock", true).then(data => {
    console.log(data);
    done();
  }).catch(done);
}