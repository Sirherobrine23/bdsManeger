import {installServer, startServer} from "./paper.js";

describe("PaperMC", function() {
  this.timeout(Infinity);
  let id: string;
  it("Install and Start", async () => {
    id = (await installServer("latest", {newId: true})).id as string
    const serverManeger = await startServer({platformOptions: {id}});
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});