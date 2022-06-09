import * as pocketmine from "./index";

export default async function pocketmineTest() {
  // Download Server
  const download = await pocketmine.DownloadServer(true);
  console.log("Version: %s, Date: %o, url: %s", download.version, download.publishDate, download.url);

  // Run Server
  const server = await pocketmine.server.startServer();
  server.server.once("started", () => console.log("Server started"));
  server.commands.execCommand("eng").execCommand("n")
  await new Promise((resolve, reject) => {
    server.server.once("started", resolve);
    server.server.once("closed", resolve);
    server.server.once("err", reject);
  });
  await server.commands.stop();

  // Backup
  const zipFile = await pocketmine.backup.CreateBackup();
  console.log("Backup created: %o", zipFile.length);
  return;
}