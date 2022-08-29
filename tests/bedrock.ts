import { installServer, startServer } from "../src/bedrock";

describe("Bedrock", () => {
  it("Install", async function(){
    this.timeout(1000*60*60*15);
    return installServer(true);
  });
  after(async () => {
    describe("After bedrock", async () => {
      it("Start Server", async function() {
        this.timeout(1000*60*60*15);
        const serverManeger = await startServer();
        serverManeger.serverProcess.on("stdoutRaw", data => process.stdout.write(data));
        serverManeger.serverActions.once("serverStarted", () => serverManeger.serverProcess.writeStdin("stop"));
        return new Promise((done, reject) => serverManeger.serverProcess.on("close", ({code}) => code === 0?done():reject(new Error("Exit another code "+code))));
      });
    });
  });
});