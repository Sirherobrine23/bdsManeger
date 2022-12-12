import { installServer, startServer } from "./pocketmine.js";

describe("Pocketmine", function() {
  this.timeout(Infinity);
  let id: string;
  it("Install and Start", async () => {
    id = (await installServer("latest", {newId: true})).id as string
    const serverManeger = await startServer({id});
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});