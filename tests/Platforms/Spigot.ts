import * as spigot from "../../src/spigot";

describe("Spigot", function (){
  this.timeout(Infinity);
  let id: string;
  it("Install", async () => id = (await spigot.installServer("latest", {newId: true})).id as string);
  it("Start", async () => {
    const serverManeger = await spigot.startServer({maxFreeMemory: true, platformOptions: {id}});
    serverManeger.events.on("portListening", console.log);
    serverManeger.events.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});