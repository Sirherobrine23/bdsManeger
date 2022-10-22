import { installServer, startServer } from "../../src/pwnuukit";

describe("Powernukkit", function() {
  this.timeout(Infinity);
  let id: string;
  it ("Install", async () => id = (await installServer("latest", {newId: true})).id as string);
  it("Start", async () => {
    const serverManeger = await startServer({maxFreeMemory: true, platformOptions: {id}});
    serverManeger.events.on("portListening", console.log);
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});