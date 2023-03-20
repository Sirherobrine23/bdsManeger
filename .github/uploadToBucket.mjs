#!/usr/bin/env node
import { oracleBucket } from "@sirherobrine23/cloud";
import extendsFS from "@sirherobrine23/extends";
import path from "node:path";
import fs from "node:fs";

const [,, remote, local] = process.argv;
const bucket = await oracleBucket.oracleBucket({
  region: "sa-saopaulo-1",
  namespace: "grwodtg32n4d",
  name: "bdsFiles",
  auth: {
    type: "preAuthentication",
    // Public auth (No write enabled).
    PreAuthenticatedKey: process.env.ociauth || process.env.OCI_AUTHKEY
  }
});

for (const file of await extendsFS.readdir(path.resolve(process.cwd(), local))) {
  console.log("Uploading %O", file);
  await bucket.uploadFile(path.posix.resolve("/", remote ?? "", path.basename(file)), await fs.promises.readFile(file).catch(() => fs.createReadStream(file)));
  console.log("Success %O", file);
}

process.exit(0);