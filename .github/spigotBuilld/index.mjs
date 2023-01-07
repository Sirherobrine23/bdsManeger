#!/usr/bin/env node
import { createReadStream, promises as fs } from "node:fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import coreUtils from "@sirherobrine23/coreutils";
import path from "path";
const oracleBucket = await coreUtils.oracleBucket("sa-saopaulo-1", "bdsFiles", "grwodtg32n4d", process.env.OCI_AUTHKEY?.trim());
const __dirname = path.dirname(new URL(import.meta.url).pathname);
let version = process.argv.find(arg => arg.startsWith("--version="))?.split("=")?.[1]?.trim() ?? "latest";

const buildFile = await coreUtils.httpRequestLarge.saveFile("https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar");
execFileSync("java", ["-jar", buildFile, "--rev", version, "-o", __dirname], {
  cwd: tmpdir(),
  stdio: "inherit"
});

const SpigotFile = (await fs.readdir(__dirname)).find(file => file.endsWith(".jar"));
if (!SpigotFile) throw new Error("No spigot file found");
if (version === "latest") version = SpigotFile.split("-")[1].split(".")[0];
await oracleBucket.uploadFile(path.posix.join("SpigotBuild", version+".jar"), createReadStream(fileBuild));
await Promise.all((await fs.readdir(__dirname)).filter(file => file.endsWith(".jar")).map(file => fs.unlink(file)));