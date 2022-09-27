import { installServer, startServer } from "../src/pocketmine";

(async function(){
  await installServer("latest");
  const serverManeger = await startServer();
  serverManeger.on("log", console.log);
  serverManeger.on("portListening", console.log);
  serverManeger.on("serverStarted", () => serverManeger.stopServer());
  return serverManeger.waitExit();
})().catch(err => console.trace(err));