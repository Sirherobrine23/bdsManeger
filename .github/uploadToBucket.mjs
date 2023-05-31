#!/usr/bin/env node
import { oracleBucket } from "@sirherobrine23/cloud";
import extendsFS from "@sirherobrine23/extends";
import fs from "node:fs";
import path from "node:path";
import { finished } from "node:stream/promises";
const args = process.argv.slice(2).map(String);
const bucket = oracleBucket.oracleBucketPreAuth("sa-saopaulo-1", "grwodtg32n4d", "bdsFiles", process.env.ociauth || process.env.OCI_AUTHKEY);

/** @type {string} */
let arg;
while (!!(arg = args.shift())) {
  if (arg.startsWith("-")) continue;
  let inPath, outPath;
  let index;
  if ((index = arg.indexOf(":")) === -1) outPath = path.relative(process.cwd(), (inPath = path.resolve(process.cwd(), arg)));
  else {
    inPath = path.resolve(process.cwd(), arg.slice(0, index));
    outPath = arg.slice(index+1);
  }

  if (!(await extendsFS.exists(inPath))) {
    console.log("%O not exists", inPath);
    continue;
  }

  if (await extendsFS.isDirectory(inPath)) {
    await extendsFS.readdirV2(inPath, true, () => true, async (relativePath, filePath, stats) => {
      if (stats.isDirectory()) return;
      console.log("Uploading %O to in Bucket %O", filePath, path.join(outPath, relativePath));
      return finished(fs.createReadStream(filePath, "binary").pipe(bucket.uploadFile(path.join(outPath, relativePath))));
    });
  } else {
    console.log("Uploading %O to in Bucket %O", filePath, path.join(outPath, relativePath));
    await finished(fs.createReadStream(inPath, "binary").pipe(bucket.uploadFile(outPath)));
  }
}