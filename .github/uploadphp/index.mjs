#!/usr/bin/env node
import { createReadStream } from "node:fs";
import coreutils from "@sirherobrine23/coreutils";
import path from "node:path";
import fs from "node:fs/promises";
if (!process.env.OCI_AUTHKEY) throw new Error("No key auth");
const ociKeyAuth = process.env.OCI_AUTHKEY.trim();
console.log("using key to upload '%s'", ociKeyAuth);

const files = (await coreutils.extendFs.readdir({folderPath: path.join(process.cwd(), "phpOutput")})).filter(file => file.endsWith(".tar.gz")||file.endsWith(".zip")||file.endsWith(".tgz"));
await Promise.all(files.map(async file => {
  const fileName = path.basename(file);
  console.log("Uploading %s", fileName);
  await coreutils.httpRequest.bufferFetch({
    url: `https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/${ociKeyAuth}/n/grwodtg32n4d/b/bdsFiles/o/php_bin/${fileName.toLowerCase()}`,
    method: "PUT",
    body: createReadStream(file),
    headers: {
      "Content-Length": (await fs.lstat(file)).size.toString(),
      "Content-Type": "application/octet-stream"
    }
  });
  console.log("Upload success to %s", fileName);
}));