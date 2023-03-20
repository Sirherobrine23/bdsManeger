#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import semver from "semver";
const __filename = path.resolve(fileURLToPath(import.meta.url));
const __dirname = path.resolve(__filename, "..");

const packages = (await fs.readdir(path.resolve(__dirname, "../package"))).map(pack => path.resolve(__dirname, "../package", pack, "package.json"));
let version = process.argv.slice(2)[0];
if (!version) {
  console.error("Required version");
  process.exit(1);
} else version = semver.valid(semver.coerce(version));

for (const packagePath of packages) {
  const packageJSON = JSON.parse(await fs.readFile(packagePath, "utf8"));
  packageJSON.version = version;
  console.log("%O now in %O version", packageJSON.name, packageJSON.version);
  if (packageJSON.dependencies?.["@the-bds-maneger/core"]) {
    console.log("Core set to %O version", packageJSON.name, packageJSON.version);
    packageJSON.dependencies["@the-bds-maneger/core"] = `^${version}`;
  }
  await fs.writeFile(packagePath, JSON.stringify(packageJSON, null, 2));
}