import path from "node:path";
import { listVersion, Bedrock } from "../src/platform/bedrock/index.js";
import { homedir } from "node:os";
await listVersion.listMojang();

const mojang = new Bedrock(path.join(homedir(), ".bdsmaneger/playgroud/mojang"), "mojang");
const version = Array.from(listVersion.mojangCache.keys()).at(9);
console.log("Installing %s", version);
await mojang.installServer(version);
mojang.on("logLine", (line) => console.log(line[0]));
const pr = await mojang.runServer();
process.stdin.pipe(pr.stdin);