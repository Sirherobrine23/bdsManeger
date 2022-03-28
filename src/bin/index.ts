import yargs from "yargs";
import readline from "readline"
import * as BdsCore from "../index";
import * as bdsTypes from "../globalType";

const Yargs = yargs(process.argv.slice(2)).command("download", "Download and Install server", yargs => {
  const options = yargs.option("platform", {
    alias: "p",
    describe: "Bds Core Platform",
    choices: ["bedrock", "java", "pocketmine", "spigot", "dragonfly"],
    default: "bedrock"
  }).option("version", {
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
  const options = await yargs.option("platform", {
    alias: "p",
    describe: "Bds Core Platform",
    choices: ["bedrock", "java", "pocketmine", "spigot", "dragonfly"],
    default: "bedrock"
  }).option("api", {
    alias: "a",
    describe: "Bds Core API port listen",
    default: "3000",
    type: "number"
  }).parseAsync();
  const Platform = options.platform as bdsTypes.Platform;
  BdsCore.API.listen(options.api);
  const Server = await BdsCore.Server.Start(Platform);
  console.log("Session ID: %s", Server.id);
  Server.on("all", data => process.stdout.write(data));
  const Input = readline.createInterface({input: process.stdin,output: process.stdout})
  Input.on("line", line => Server.commands.execCommand(line));
  Server.exit(Input.close);
  Input.on("close", () => Server.commands.execCommand("stop"));
}).command({
  command: "*",
  handler: () => {
    Yargs.showHelp();
  }
}).help().version(false);
Yargs.parseAsync();