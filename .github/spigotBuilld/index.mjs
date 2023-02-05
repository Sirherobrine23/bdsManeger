#!/usr/bin/env node
import { createReadStream, promises as fs } from "node:fs";
import { Cloud, Extends } from "@sirherobrine23/coreutils";
import path from "path";
const { tenancy, fingerprint, privateKey, user, passphase } = process.env;
const oracleBucket = await Cloud.oracleBucket({
  region: "sa-saopaulo-1",
  name: "bdsFiles",
  namespace: "grwodtg32n4d",
  auth: {
    type: "user",
    tenancy,
    fingerprint,
    privateKey,
    user,
    passphase
  }
})
const __dirname = path.resolve(process.cwd(), process.argv.slice(2)[0]||"");

await Extends.extendsFS.readdir({folderPath: __dirname}).then(files => files.filter(file => file.endsWith(".jar"))).then(async files => {
  for (const file of files) {
    const version = path.basename(file, ".jar").split("-")[1];
    if (!version) continue;
    console.log("Uploading %s, file: %O", version, "SpigotBuild/"+version+".jar");
    await oracleBucket.uploadFile("SpigotBuild/"+version+".jar", createReadStream(file)).then(() => console.log("Uploaded %s", version));
    await fs.unlink(file);
  }
});