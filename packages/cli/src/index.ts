#!/usr/bin/env node
// import { createInterface as readline } from "node:readline";
import bdsCore from "@the-bds-maneger/core";
import yargs from "yargs";

// Init yargs
yargs(process.argv.slice(2)).version(false).help(true).strictCommands().demandCommand().alias("h", "help")
.command("install", "Install server", async yargs => {
  const options = yargs.option("platform", {
    type: "string",
    string: true,
    alias: "p",
    choices: ["bedrock", "java"],
    default: "bedrock",
    description: "Platform to install"
  })
  .option("altserver", {
    type: "string",
    string: true,
    alias: "a",
    choices: ["spigot", "paper", "purpur", "pocketmine", "powernukkit", "nukkit", "cloudbust"],
  })
  .option("id", {
    alias: "i",
    type: "string",
    describe: "ID to update server"
  })
  .option("version", {
    type: "string",
    alias: "V",
    describe: "Server version",
    default: "latest"
  })
  .option("beta", {
    type: "boolean",
    boolean: true,
    default: false,
    describe: "allow install beta or snapshort versions"
  })
  .parseSync();

  const serverPath = await bdsCore.serverManeger.serverManeger(options.platform === "java" ? "java" : "bedrock", {
    ...(options.id ? {newID: false, ID: options.id} : {newID: true}),
  });

  const installData = await (options.platform === "java" ? bdsCore.Java.installServer : bdsCore.Bedrock.installServer)(Object.assign({}, serverPath, {
    version: options.version,
    altServer: options.altserver as never,
    allowBeta: Boolean(options.beta)
  }));

  console.log("ID: %O, Server Version: %O, Server Date: %O", installData.id, installData.version, installData.date);
})
.command("list", "list all versions", yargs => {
  const { platform, altserver } = yargs.option("platform", {
    type: "string",
    string: true,
    alias: "p",
    choices: ["bedrock", "java"],
    default: "bedrock",
    description: "Platform to install"
  }).option("altserver", {
    type: "string",
    string: true,
    alias: "a",
    choices: ["spigot", "paper", "purpur", "pocketmine", "powernukkit", "nukkit", "cloudbust"],
  }).parseSync();
  return (platform === "java" ? bdsCore.Java.listVersions : bdsCore.Bedrock.listVersions)(altserver as never).then(data => console.log(JSON.stringify(data, null, 2)));
})
.command("run", "Start server", async yargs => {
  const option = yargs.option("id", {
    type: "string",
    string: true,
    alias: "d",
    demandOption: true,
  }).parseSync();
  const idInfo = (await bdsCore.listIDs()).find(local => local.id === option.id);
  if (!idInfo) throw new Error("Invalid ID");
  const sserverPaths = await bdsCore.serverManeger.serverManeger(option.platform === "java" ? "java" : "bedrock", {ID: option.id, newID: false});
  const session = await (idInfo.platform === "java" ? bdsCore.Java.startServer : bdsCore.Bedrock.startServer)(sserverPaths);
  process.on("error", console.log);
  session.once("backup", filePath => console.log("Backup file path: %O", filePath));
  process.stdin.pipe(session.stdin);
  session.stdout.pipe(process.stdout);
  session.stderr.pipe(process.stderr);
  for (const ss of ([
    "SIGCONT",
    "SIGINT",
    "SIGTERM",
  ] as NodeJS.Signals[])) process.on(ss, () => session.stopServer());
  return session;
})
.parseAsync().catch(err => {
  console.log(err);
  process.exit(1);
});