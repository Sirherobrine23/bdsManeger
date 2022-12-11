import { installServer, startServer } from "../../src/bedrock";

if (!(process.platform === "win32"||process.platform === "linux")) console.log("Bedrock disabled to %s, avaible only to Windows and Linux");
else {
  describe("Bedrock", async function() {
    this.timeout(Infinity);
    let id: string;
    it("Install", async () => id = (await installServer({version: "latest", platformOptions: {newId: true}})).id as string);
    it("Start", async () => {
      const serverManeger = await startServer({id});
      serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
      return serverManeger.waitExit();
    });
  });
}