import * as Bedrock from "./bedrock.js";

if (!(process.platform === "win32"||process.platform === "linux")) console.log("Bedrock disabled to %s, avaible only to Windows and Linux");
else {
  describe("Bedrock", async function() {
    this.timeout(Infinity);
    let id: string;
    it("Install and Start", async () => {
      id = (await Bedrock.installServer({version: "latest", platformOptions: {newId: true}})).id as string
      const serverManeger = await Bedrock.startServer({id});
      serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
      return serverManeger.waitExit();
    });
  });
}