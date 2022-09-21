import { installServer, startServer } from "../src/pocketmine";

describe("Pocketmine", () => {
  it("Install and Start", async function() {
    this.timeout(Infinity);
    await installServer("latest");
    const serverManeger = await startServer();
    serverManeger.on("log_stdout", console.log);
    serverManeger.on("log_stderr", console.info);
    serverManeger.on("portListening", console.log);
    serverManeger.on("log_stdout", data => {
      if(/set-up.*wizard/.test(data)) {
        serverManeger.runCommand("eng");
        serverManeger.runCommand("y");
        serverManeger.runCommand("y");
        serverManeger.runCommand("");
      }
    });
    serverManeger.on("serverStarted", () => serverManeger.stopServer());
    return serverManeger.waitExit();
  });
});