import * as java from "./java.js";

describe("Java", function() {
  this.timeout(Infinity);
  let id: string;
  it("Install and Start", async () => {
    id = (await java.installServer("latest", {newId: true})).id as string
    const serverManeger = await java.startServer({
      platformOptions: {id}
    });
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});
