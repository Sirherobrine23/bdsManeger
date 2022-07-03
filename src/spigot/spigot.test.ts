import * as spigot from "./index";

export default async function spigotTest() {
  // Download and install server
  const download = await spigot.DownloadServer(true);
  console.log("Version: %s, Date: %o, url: %s", download.version, download.publishDate, download.url);

  // Start Server
  const server = await spigot.server.startServer();
  if (process.argv.includes("--show-log")) server.server.on("log", console.log);
  server.server.once("started", () => console.log("Server started"));
  server.server.on("port_listen", port => console.log("Server listening on port: %o with protocol: %s", port.port, port.protocol));
  await new Promise((resolve, reject) => {
    server.server.once("started", resolve);
    server.server.once("closed", code => code === null ? resolve(code) : reject(code));
  });
  await server.commands.stop();

  // Backup
  const zipFile = await spigot.backup.CreateBackup();
  console.log("Backup created: %o", zipFile.length);
  return;
}