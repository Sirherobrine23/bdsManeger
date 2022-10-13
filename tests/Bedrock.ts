import { installServer, startServer } from "../src/bedrock";

if (process.platform === "win32"||process.platform === "linux") {
  describe("Bedrock", () => {
    it("Install and Start", async function(){
      this.timeout(Infinity);
      const {id} = await installServer("latest", {newId: true});
      const serverManeger = await startServer({id});
      serverManeger.events.on("log_stdout", console.log);
      serverManeger.events.on("log_stderr", console.log);
      serverManeger.events.on("portListening", console.log);
      serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
      return serverManeger.waitExit();
    });
  });
} else console.log("Bedrock disabled to %s, avaible only to Windows and Linux");