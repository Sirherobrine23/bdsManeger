import path from "node:path";
import { listVersion, Bedrock } from "../src/platform/bedrock/index.js";
import { homedir } from "node:os";

const server = new Bedrock(path.join(homedir(), ".bdsmaneger/playgroud/mojang"), "pocketmine");
server.once("installedVersion", version => console.log("Installed %s server", version));
await listVersion.listPocketmineProject();
console.log("Init install");
await server.installServer(0);
server.on("logLine", (line) => console.log(line[0]));
const pr = await server.runServer();
process.stdin.pipe(pr.stdin);