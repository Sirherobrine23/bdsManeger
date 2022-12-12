import * as spigot from "./spigot.js";

describe("Spigot", function (){
  this.timeout(Infinity);
  let id: string;
  it("Install and Start", async () => {
    id = (await spigot.installServer("latest", {newId: true})).id as string
    const serverManeger = await spigot.startServer({platformOptions: {id}});
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});