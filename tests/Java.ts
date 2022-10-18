import * as java from "../src/java";

describe("Java", () => {
  it("Install and Start", async function(){
    this.timeout(Infinity);
    const {id} = await java.installServer("latest", {newId: true});
    const serverManeger = await java.startServer({
      platformOptions: {id},
      maxFreeMemory: true
    });
    serverManeger.events.on("log_stdout", console.log);
    serverManeger.events.on("log_stderr", console.info);
    serverManeger.events.on("portListening", console.log);
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});
