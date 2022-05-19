import path from "path";
import fs from "fs";
import os from "os";
import * as versionManeger from "@the-bds-maneger/server_versions";
import * as httpRequests from "../../HttpRequests";

export default async function download(version: string|boolean) {
  const ServerPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), "java");
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