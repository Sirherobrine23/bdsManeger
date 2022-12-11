#!/usr/bin/env node
import coreutils from "@sirherobrine23/coreutils";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
if (!process.env.OCI_AUTHKEY) throw new Error("No key auth");
const ociKeyAuth = process.env.OCI_AUTHKEY.trim();
console.log("using key to upload '%s'", ociKeyAuth);

const files = (await coreutils.extendFs.readdirrecursive(path.join(process.cwd(), "phpOutput"))).filter(file => file.endsWith(".tar.gz")||file.endsWith(".zip")||file.endsWith(".tgz"));
await Promise.all(files.map(async file => {
  const fileName = path.basename(file);
  console.log("Uploading %s", fileName);
  // https://docs.oracle.com/en-us/iaas/api/#/en/objectstorage/20160918/Object/PutObject
  await coreutils.httpRequest.bufferFetch({
    url: `https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/${ociKeyAuth}/n/grwodtg32n4d/b/bdsFiles/o/php_bin/${fileName}`,
    method: "PUT",
    body: createReadStream(file),
    headers: {
      "Content-Length": (await fs.lstat(file)).size.toString(),
      "Content-Type": "application/octet-stream"
    }
  });
  console.log("Upload success to %s", fileName);
}));