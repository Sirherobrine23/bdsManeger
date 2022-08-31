import { installServer, startServer } from "../src/bedrock";

if (process.platform === "win32"||process.platform === "linux") {

describe("Bedrock", () => {
  it("Install and Start", async function(){
    this.timeout(1000*60*60*15);
    await installServer("latest");
    const serverManeger = await startServer();
    serverManeger.on("log_stdout", console.log);
    serverManeger.on("log_stderr", console.log);
    serverManeger.on("portListening", console.log);
    serverManeger.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});

}
