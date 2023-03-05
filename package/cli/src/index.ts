#!/usr/bin/env node
import { createInterface as readline } from "node:readline";
import bdsCore from "@the-bds-maneger/core";
import yargs from "yargs";

// Init yargs
yargs(process.argv.slice(2)).version(false).help(true).strictCommands().demandCommand().alias("h", "help")

// bedrock
.command("bedrock", "Bedrock", yargs => yargs.strictCommands().demandCommand().command("install", "Install Server", async yargs => {
  const options = yargs.option("altServer", {
    alias: "a",
    string: true,
    description: "Select a server other than Mojang",
    demandOption: false,
    choices: [
      "pocketmine",
      "powernukkit",
      "cloudbust"
    ],
  }).option("id", {
    alias: "i",
    string: true,
    description: "Select Server ID"
  }).option("list", {
    alias: "l",
    boolean: true,
    default: false,
    description: "List versions instead of installing"
  }).option("version", {
    alias: "V",
    string: true,
    default: "latest",
    description: "Server version to install",
  }).option("update", {
    alias: "u",
    boolean: true,
    default: false,
    description: "Update/Downgrade installed server version"
  }).parseSync();
  if (options.list) return console.log(JSON.stringify(await bdsCore.Bedrock.listVersions(options.altServer as any), null, 2));
  const data = await bdsCore.Bedrock.installServer({
    altServer: options.altServer as any,
    version: options.version,
    ID: options.id,
    newID: !options.update,
  });
  return console.log("Server ID: %O, Version: %O, Release Date: %s", data.id, data.version, data.releaseDate);
}).command("run", "Start Server", async yargs => {
  const options = yargs.option("altServer", {
    alias: "a",
    string: true,
    description: "Select a server other than Mojang",
    demandOption: false,
    choices: [
      "pocketmine",
      "powernukkit",
      "cloudbust"
    ],
  }).option("id", {
    alias: "i",
    string: true,
    description: "Select Server ID",
    demandOption: true,
  }).parseSync();
  const server = await bdsCore.Bedrock.startServer({
    newID: false,
    ID: options.id,
    altServer: options.altServer as any,
  });
  const read = readline(process.stdin, process.stdout).on("error", () => {}).on("line", data => server.sendCommand(data)).on("SIGINT", () => server.stopServer()).on("SIGCONT", () => server.stopServer()).on("SIGTSTP", () => server.stopServer());
  server.once("spawn", () => console.log("Stating server!"));
  server.on("line", (data, from) => console.log("[%s]: %O", from, data));
  server.on("player", data => console.log("%O", data));
  server.once("close", () => read.close());
  server.on("backup", status => console.log("Backup status %O", status));
  // process.stdin.pipe(server.stdin);
  return server;
}))

// run
.parseAsync();