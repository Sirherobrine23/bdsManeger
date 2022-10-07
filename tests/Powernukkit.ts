import { installServer, startServer } from "../src/pwnuukit";

describe("Powernukkit", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    await installServer("latest");
    const serverManeger = await startServer();
    serverManeger.events.on("log_stdout", console.log);
    serverManeger.events.on("log_stderr", console.log);
    serverManeger.events.on("portListening", console.log);
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});