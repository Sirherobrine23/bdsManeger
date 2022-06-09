import * as bedrock from "./index";

export default async function bedrockTest() {
  // Download Server
  const download = await bedrock.DownloadServer(true);
  console.log("Version: %s, Date: %o, url: %s", download.version, download.publishDate, download.url);

  // Config
  const currentConfig = await bedrock.config.getConfig();
  console.log("Current config: %o", currentConfig);
  currentConfig.gamemode = Math.floor(Math.random() * 2) > 3 ? "survival" : "creative";
  currentConfig.worldName = "test"+Math.floor(Math.random()*100);
  const newConfig = await bedrock.config.CreateServerConfig(currentConfig);
  console.log("New config: %o", newConfig);

  // Run Server
  const server = await bedrock.server.startServer();
  server.server.once("started", () => console.log("Server started"));
  await new Promise((resolve, reject) => {
    server.server.once("started", resolve);
    server.server.once("closed", resolve);
    server.server.once("err", reject);
  });
  await server.commands.stop();

  // Backup
  const zipFile = await bedrock.backup.CreateBackup();
  console.log("Backup created: %o", zipFile.length);
  return;
}