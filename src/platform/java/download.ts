import path from "node:path";
import fs from "node:fs";
import * as versionManeger from "@the-bds-maneger/server_versions";
import * as httpRequests from "../../lib/HttpRequests";
import { serverRoot } from "../../pathControl";

export default async function download(version: string|boolean) {
  const ServerPath = path.join(serverRoot, "java");
  if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
  if (!(await fs.existsSync(ServerPath))) fs.mkdirSync(ServerPath, {recursive: true});
    const javaInfo = await versionManeger.findUrlVersion("java", version);
    await fs.promises.writeFile(path.resolve(ServerPath, "Server.jar"), await httpRequests.getBuffer(String(javaInfo.url)));
    await fs.promises.writeFile(path.resolve(ServerPath, "eula.txt"), "eula=true");

  // Return info
  return {
    version: javaInfo.version,
    publishDate: javaInfo.datePublish,
    url: javaInfo.url,
  };
}