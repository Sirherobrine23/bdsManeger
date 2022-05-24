import { DownloadServer, config, server } from "./index";

export async function testBedrock() {
  const downlaod = await DownloadServer("latest");
  console.log(downlaod);
  const currentConfig = await config.getConfig();
  console.log(currentConfig);
  currentConfig.worldName = "test";
  const newConfig = await config.CreateServerConfig(currentConfig);
  console.log(newConfig);
  console.log("Starting bedrock server...");
  const session = await server.startServer();
  session.log.on("all", console.log);
  await new Promise(res => {
    session.server.once("started", (date: Date) => {
      console.log("bedrock started at", date);
      console.log("Stoping bedrock");
      res("");
    });
  });
  console.log("Stoping bedrock");
  return session.commands.stop();
}