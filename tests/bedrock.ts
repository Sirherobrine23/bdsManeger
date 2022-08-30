import { installServer, startServer } from "../src/bedrock";

describe("Bedrock", () => {
  it("Install and Start", async function(){
    this.timeout(1000*60*60*15);
    await installServer("latest");
    const serverManeger = await startServer();
    serverManeger.on("log_stdout", data => process.stdout.write(data));
    serverManeger.once("serverStarted", () => serverManeger.stopServer());
    return new Promise((done, reject) => serverManeger.on("exit", ({code}) => code === 0?done():reject(new Error("Exit another code "+code))));
  });
});
