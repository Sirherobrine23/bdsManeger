import * as java from "../../src/java";

describe("Java", function() {
  this.timeout(Infinity);
  let id: string;
  it("Install", async () => id = (await java.installServer("latest", {newId: true})).id as string);
  it("Start", async () => {
    const serverManeger = await java.startServer({
      platformOptions: {id},
      maxFreeMemory: true
    });
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});
