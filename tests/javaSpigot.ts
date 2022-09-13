import * as java from "../src/java";
import * as spigot from "../src/spigot";

describe("Java", () => {
  it("Install and Start", async function(){
    this.timeout(1000*60*60*15);
    await java.installServer("latest");
    const serverManeger = await java.startServer();
    serverManeger.on("log_stdout", console.log);
    serverManeger.on("log_stderr", console.info);
    serverManeger.on("portListening", console.log);
    serverManeger.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});

describe("Spigot", () => {
  it("Install and Start", async function(){
    this.timeout(1000*60*60*15);
    await spigot.installServer("latest");
    const serverManeger = await spigot.startServer({configureGeyser: true});
    serverManeger.on("log_stdout", console.log);
    serverManeger.on("log_stderr", console.info);
    serverManeger.on("portListening", console.log);
    serverManeger.once("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});