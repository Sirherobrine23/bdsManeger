import * as spigot from "../src/spigot";

describe("Spigot", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    await spigot.installServer("latest");
    const serverManeger = await spigot.startServer({configureGeyser: true});
    serverManeger.on("log_stdout", console.log);
    serverManeger.on("log_stderr", console.info);
    serverManeger.on("portListening", console.log);
    serverManeger.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});