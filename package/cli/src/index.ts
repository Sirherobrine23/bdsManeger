#!/usr/bin/env node
import bdsCore from "@the-bds-maneger/core";
import yargs from "yargs";

// Init yargs
yargs(process.argv.slice(2)).version(false).help(true).strictCommands().demandCommand()

// bedrock
.command("bedrock", "Bedrock", yargs => yargs.command("install", "Install Server", async yargs => {
  const options = yargs.option("altServer", {
    string: true,
    description: "Select a server other than Mojang",
    demandOption: false,
    choices: [
      "pocketmine",
      "powernukkit",
      "cloudbust"
    ],
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
  }).parseSync();
  if (options.list) return console.log(JSON.stringify(await bdsCore.Bedrock.listVersions({altServer: options.altServer as any}), null, 2));
  const data = await bdsCore.Bedrock.installServer({
    altServer: options.altServer as any,
    version: options.version,
  });
  console.log("Server ID: %O", data.id);
}))

// run
.parseAsync();