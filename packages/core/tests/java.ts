import path from "node:path";
import { Java } from "../src/platform/java/index.js";
import { homedir } from "node:os";
import { rm } from "node:fs/promises";

await rm(path.join(homedir(), ".bdsmaneger/playgroud/java"), { recursive: true }).catch(() => {});
const server = new Java(path.join(homedir(), ".bdsmaneger/playgroud/java"), "cuberite");
await server.installServer(0);
server.on("logLine", line => console.log(line));
const run = await server.runServer();
process.stdin.pipe(run.stdin);
