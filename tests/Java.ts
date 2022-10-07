import * as java from "../src/java";

describe("Java", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    await java.installServer("latest");
    const serverManeger = await java.startServer();
    serverManeger.events.on("log_stdout", console.log);
    serverManeger.events.on("log_stderr", console.info);
    serverManeger.events.on("portListening", console.log);
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});
