import readline from "readline"
import yargs from "yargs";
import { isValidCron } from "cron-validator";
import * as BdsCore from "../index";
import * as bdsTypes from "../globalType";
import cli_color from "cli-color";

const Yargs = yargs(process.argv.slice(2)).option("platform", {
  alias: "p",
  describe: "Bds Core Platform",
  demandOption: true,
  type: "string",
  choices: ["bedrock", "java", "pocketmine", "spigot", "dragonfly"],
  default: "bedrock"
}).command("download", "Download and Install server", yargs => {
  const options = yargs.option("version", {
    alias: "v",
    describe: "Server Version",
    demandOption: true,
    type: "string"
  }).parseSync();
  const Platform = options.platform as bdsTypes.Platform;
  console.log("Starting Download...");
  BdsCore.DownloadServer.DownloadServer(Platform, options.version === "latest"?true:options.version).then(res => {
    console.log("Sucess to download server");
    console.info("Release date: %s", `${res.Date.getDate()}/${res.Date.getMonth()+1}/${res.Date.getFullYear()}`);
  });
}).command("start", "Start Server", async yargs => {
  const options = await yargs.option("api", {
    alias: "a",
    describe: "port listen to listen to api",
    type: "number"
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
  if(!!options.api) BdsCore.API.listen(options.api);
  const Server = await BdsCore.Server.Start(Platform);
  console.log("Session ID: %s", Server.id);
  Server.on("all", data => console.log(cli_color.blueBright(data.replace("true", cli_color.greenBright("true"))).replace("false", cli_color.redBright("false"))));
  const Input = readline.createInterface({input: process.stdin,output: process.stdout})
  Input.on("line", line => Server.commands.execCommand(line));
  let closed = false;
  Input.on("close", () => {
    if (closed) return;
    Server.stop();
    closed = true;
  });
  Server.exit(() => {
    if (closed) return;
    Input.close();
    closed = true;
  });
  if (!!options.cronBackup) {
    console.log("Backup Maps enabled");
    Server.creteBackup(options.cronBackup);
  }
}).command({
  command: "*",
  handler: () => {
    Yargs.showHelp();
  }
}).help().version(false);
Yargs.parseAsync();