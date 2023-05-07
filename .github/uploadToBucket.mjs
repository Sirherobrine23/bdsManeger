#!/usr/bin/env node
import { oracleBucket } from "@sirherobrine23/cloud";
import { pipeline } from "node:stream/promises";
import extendsFS from "@sirherobrine23/extends";
import path from "node:path";
import fs from "node:fs";
const bucket = oracleBucket.oracleBucketPreAuth("sa-saopaulo-1", "grwodtg32n4d", "bdsFiles", process.env.ociauth || process.env.OCI_AUTHKEY);
const args = process.argv.slice(2).map(String);

for (let argI = 0; argI < args.length; argI++) {
  if (args.at(argI).startsWith("-")) continue;
  const file = path.resolve(process.cwd(), args.at(argI));
  if (!(await extendsFS.exists(file))) {
    console.log("File %O dont exists!", file);
    if (args.at(argI + 1) && args.at(argI + 1).startsWith("-")) argI++;
  }
  let filename = path.basename(args.at(argI));
  if (typeof filename === "string" && args.at(argI + 1) && args.at(argI + 1).startsWith("-")) {
    argI++;
    filename = args.at(argI).slice(1);
    while (filename.startsWith("-")) filename = filename.slice(1);
    filename.split(path.win32.sep).join(path.posix.sep);
  }

  if (await extendsFS.isDirectory(file)) {
    const fileList = await extendsFS.readdirV2(file, true, (_1, _2, stats) => stats.isFile() || stats.isDirectory());
    for (const file of fileList) {
      if (extendsFS.isDirectory(file.fullPath)) continue;
      console.log("Uploading %O to %O", file.fullPath, path.join(filename, file.path));
      await pipeline(fs.createReadStream(file.fullPath), bucket.uploadFile(path.join(filename, file.path)));
    }
  } else {
    console.log("Uploading %O to %O", file, filename);
    await pipeline(fs.createReadStream(file), bucket.uploadFile(filename));
  }

  console.log("Done!");
}