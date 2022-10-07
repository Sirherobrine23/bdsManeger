import * as paper from "../src/paper";

describe("PaperMC", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    await paper.installServer("latest");
    const serverManeger = await paper.startServer({maxFreeMemory: true});
    serverManeger.events.on("log_stdout", console.log);
    serverManeger.events.on("log_stderr", console.info);
    serverManeger.events.on("portListening", console.log);
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});