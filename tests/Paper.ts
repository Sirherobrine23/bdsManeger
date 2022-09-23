import * as paper from "../src/paper";

describe("PaperMC", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    await paper.installServer("latest");
    const plugin = await paper.pluginManger();
    await plugin.installPlugin("Geyser");
    const serverManeger = await paper.startServer({maxFreeMemory: true});
    serverManeger.on("log_stdout", console.log);
    serverManeger.on("log_stderr", console.info);
    serverManeger.on("portListening", console.log);
    serverManeger.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});