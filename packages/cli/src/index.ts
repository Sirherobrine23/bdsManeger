#!/usr/bin/env node
// import { createInterface as readline } from "node:readline";
import bdsCore from "@the-bds-maneger/core";
import yargs from "yargs";

// Init yargs
yargs(process.argv.slice(2)).version(false).help(true).strictCommands().demandCommand().alias("h", "help")
.command(["install", "i", "update"], "Install/update server platform", yargs => yargs, async options => {
  console.log(bdsCore);
})
.command(["start", "run", "$0"], "start server", yargs => yargs, async options => {})
.parseAsync().catch(err => {
  console.log(err);
  process.exit(1);
});