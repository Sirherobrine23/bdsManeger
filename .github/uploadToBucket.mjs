#!/usr/bin/env node
import { createReadStream } from "fs";
import { oracleBucket } from "@sirherobrine23/cloud";
import extendsFS from "@sirherobrine23/extends";
import path from "node:path";

const [,, remote, local] = process.argv;
const bucket = await oracleBucket.oracleBucket({
  region: "sa-saopaulo-1",
  namespace: "grwodtg32n4d",
  name: "bdsFiles",
  auth: {
    type: "preAuthentication",
    // Public auth (No write enabled).
    PreAuthenticatedKey: process.env.OCI_AUTHKEY
  }
});

for await (const file of await extendsFS.readdir(path.resolve(process.cwd(), local))) {
  console.log("Uploading %O", file);
  await bucket.uploadFile(path.posix.resolve("/", remote ?? "", path.basename(file)), createReadStream(file));
  console.log("Success %O", file);
}