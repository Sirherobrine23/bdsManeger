import * as spigot from "../src/spigot";

describe("Spigot", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    await spigot.installServer("latest");
    const serverManeger = await spigot.startServer();
    serverManeger.events.on("log_stdout", console.log);
    serverManeger.events.on("log_stderr", console.info);
    serverManeger.events.on("portListening", console.log);
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});