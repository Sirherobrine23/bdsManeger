#!/usr/bin/env node
import readline from "readline"
import yargs from "yargs";
import { isValidCron } from "cron-validator";
import * as BdsCore from "../index";
import * as bdsTypes from "../globalType";
import cli_color from "cli-color";
import path from "path";
import { promises as fsPromise } from "fs";

const Yargs = yargs(process.argv.slice(2)).command("download", "Download and Install server", async yargs => {
  const options = yargs.option("version", {
    alias: "v",
    describe: "Server Version",
    demandOption: true,
    type: "string"
  }).option("platform", {
    alias: "p",
    describe: "Bds Core Platform",
    demandOption: true,
    type: "string",
    choices: ["bedrock", "java", "pocketmine", "spigot", "dragonfly"],
    default: "bedrock"
  }).parseSync();
  const Platform = options.platform as bdsTypes.Platform;
  console.log("Starting Download...");
  return BdsCore.downloadServer.DownloadServer(Platform, options.version === "latest"?true:options.version).then(res => {
    console.log("Sucess to download server");
    console.info("Release date: %s", `${res.Date.getDate()}/${res.Date.getMonth()+1}/${res.Date.getFullYear()}`);
  });
}).command("backup", "Create Backups", async yargs => {
  const {storage, git} = await yargs.option("storage", {
    alias: "s",
    describe: "Storage Path",
    demandOption: false,
    type: "string",
    default: path.join(process.cwd(), "backup_"+new Date().toString().replace(/[-\(\)\:\s+]/gi, "_"))+".zip"
  }).option("git", {
    alias: "g",
    describe: "Git Repository, example to remote: -g \"<user>,<pass>,<Url>\", or local: -g \"local\"",
    demandOption: false,
    type: "string",
    default: ""
  }).parseAsync();
  if (!!git) {
    if (git.toLocaleLowerCase() === "local") return BdsCore.Backup.gitBackup();
    else {
      const [user, pass, url] = git.split(",");
      return BdsCore.Backup.gitBackup({
        repoUrl: url,
        Auth: {
          Username: user,
          PasswordToken: pass
        }
      });
    }
  }
  const zipBuffer = await BdsCore.Backup.CreateBackup(false);
  return fsPromise.writeFile(storage, zipBuffer);
}).command("start", "Start Server", async yargs => {
  const options = await yargs.option("platform", {
    alias: "p",
    describe: "Bds Core Platform",
    demandOption: true,
    type: "string",
    choices: ["bedrock", "java", "pocketmine", "spigot", "dragonfly"],
    default: "bedrock"
  }).option("cronBackup", {
    alias: "b",
    describe: "cron job to backup server maps",
    type: "string"
  }).parseAsync();
  const Platform = options.platform as bdsTypes.Platform;
  if (!!options.cronBackup) {
    if (!(isValidCron(options.cronBackup, {seconds: true}))) {
      console.error("Invalid cron job");
      process.exit(1);
    }
  }
  const Server = await BdsCore.Server.Start(Platform);
  console.log("Session ID: %s", Server.id);
  Server.logRegister("all", data => console.log(cli_color.blueBright(data.replace("true", cli_color.greenBright("true"))).replace("false", cli_color.redBright("false"))));
  const Input = readline.createInterface({input: process.stdin,output: process.stdout})
  Input.on("line", line => Server.commands.execCommand(line));
  if (!!options.cronBackup) {
    console.log("Backup Maps enabled");
    const backupCron = Server.creteBackup(options.cronBackup);
    Server.onExit(() => backupCron.stop());
  }
  return new Promise(resolve => {
    let closed = false;
    Input.on("close", () => {
      if (closed) return;
      Server.stop();
      closed = true;
      resolve();
    });
    Server.onExit(code => {
      console.log("Server exit with code: %s", code);
      if (closed) return;
      Input.close();
      closed = true;
      resolve();
    });
  });
}).command({
  command: "*",
  handler: () => {
    Yargs.showHelp();
  }
}).help().version(false);
Yargs.parseAsync().then(() => {
  console.log("Exiting...");
  process.exit(0);
});