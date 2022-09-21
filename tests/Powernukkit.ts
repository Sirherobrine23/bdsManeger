import { installServer, startServer } from "../src/pwnuukit";

describe("Powernukkit", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    await installServer("latest");
    const serverManeger = await startServer();
    serverManeger.on("log_stdout", console.log);
    serverManeger.on("log_stderr", console.log);
    serverManeger.on("portListening", console.log);
    serverManeger.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});