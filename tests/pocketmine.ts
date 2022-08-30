import { createWriteStream, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { installServer, startServer } from "../src/pocketmine";

describe("Pocketmine", () => {
  it("Install and Start", async function() {
    this.timeout(1000*60*60*15);
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
    writeFileSync(resolve(__dirname, "../server.log"), "");
    const log = createWriteStream(resolve(__dirname, "../server.log"), {flags: "a"});
    serverManeger.childProcess.child?.stdout?.pipe(log);
    return new Promise((done, reject) => serverManeger.on("exit", ({code}) => code === 0?done():reject(new Error("Exit another code "+code))));
  });
});