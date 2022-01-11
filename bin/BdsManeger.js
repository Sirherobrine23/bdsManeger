#!/usr/bin/env node
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds-Manger-CLI";
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const BdsCore = require("../src/index");
const cli_color = require("cli-color");
const inquirer = require("inquirer");
const Yargs = require("yargs").usage("$0 [args]");
Yargs.option("info", {
  alias: "i",
  describe: "Show info",
  type: "boolean"
});
Yargs.option("download", {
  describe: "Download Bds Server",
  type: "string",
  alias: "d",
});
Yargs.option("kill", {
  alias: "k",
  describe: "Kill Bds Servers",
  type: "boolean",
  default: true
});
Yargs.command("backup", "Backup Bds Server", {}, () => {
  const Bc = BdsCore.BdsBackup.Backup();
  Bc.write_file();
  console.log(cli_color.greenBright(`Backup created save in: ${Bc.file_path}`));
  process.exit(0);
});
Yargs.option("platform", {
  alias: "p",
  describe: "Select BdsManeger Platform available to system and architecture",
  type: "string"
});
Yargs.option("get_domain", {
  describe: "Get Domain to connect to the Server",
  type: "boolean",
  default: false
});
Yargs.option("no-api", {
  describe: "Desactivate BdsManeger API",
  type: "boolean",
  default: false
});
// World Options
Yargs.option("world-name", {
  describe: "World Name, (Some platforms do not accept spaces)",
  type: "string"
});
Yargs.option("description", {
  describe: "World Description",
  type: "string"
});
Yargs.option("gamemode", {
  describe: "Default Server Gamemode",
  type: "string"
});
Yargs.option("difficulty", {
  describe: "Default Server Difficulty",
  type: "string"
});
Yargs.option("players", {
  describe: "Max Players to Connect to the Server",
  type: "number",
  default: 15
});
// Debug
Yargs.option("debug", {
  describe: "Debug",
  type: "boolean",
  default: false
});

async function DownloadServer(waitUserSelectVersion = "") {
  const ora = (await import("ora")).default;
  const Platform = BdsCore.BdsSettings.CurrentPlatorm();
  const BdsCoreUrlManeger = require("@the-bds-maneger/server_versions");
  const Versions = (await BdsCoreUrlManeger.listAsync());
  if (waitUserSelectVersion === true || !waitUserSelectVersion) waitUserSelectVersion = (await inquirer.prompt({
    type: "list",
    name: "version",
    message: `Select the version to download ${Platform}`,
    choices: [
      {
        name: `Latest Version (${Versions.latest[Platform]})`,
        value: "latest"
      },
      ...(Versions.platform.filter(Version => Version.name === Platform).map(version => ({name: `v${version.version}`, value: version.version})))
    ]
  })).version;
  const RunSpinner = ora("Downloading...").start();
  try {
    const DownloadRes = await BdsCore.BdsDownload.DownloadServer(waitUserSelectVersion || "latest");
    RunSpinner.succeed(`Downloaded ${DownloadRes.version}, Published in ${DownloadRes.data.getDate()}/${DownloadRes.data.getMonth()}/${DownloadRes.data.getFullYear()}`);
  } catch (err) {
    RunSpinner.fail(String(err));
    process.exit(1);
  }
}

async function info() {
  const commandExist = require("../src/lib/commandExist");
  const { valid_platform } = await (require("../src/lib/BdsSystemInfo"))();
  var checkothearch = "";
  if (process.platform === "linux" && BdsCore.BdsSystemInfo.arch !== "x64"){
    checkothearch = `qemu-x86_64-static is installed to emulate an x64 system: ${commandExist("qemu-x86_64-static")}\n`
  }
  if (process.platform === "android" && BdsCore.BdsSystemInfo.arch !== "x64"){
    checkothearch = `qemu-x86_64 is installed to emulate an x64 system: ${commandExist("qemu-x86_64")}\n`
  }
  const info = [
    "",
    `Bds Maneger Core And Bds Maneger CLI version: ${cli_color.magentaBright(BdsCore.version)}`,
    `System: ${cli_color.yellow(process.platform)}, architecture: ${cli_color.blue(BdsCore.BdsSystemInfo.arch)}`,
    checkothearch,
    "**************************************************************",
    "* Servers currently available:",
    `*   - Bedrock:          ${valid_platform.bedrock ? cli_color.greenBright("Avaible") : cli_color.redBright("Not Avaible")}`,
    `*   - Java and Spigot:  ${valid_platform.java ? cli_color.greenBright("Avaible") : cli_color.redBright("Not Avaible")}`,
    `*   - Dragonfly:        ${valid_platform.dragonfly ? cli_color.greenBright("Avaible") : cli_color.redBright("Not Avaible")}`,
    `*   - Pocketmine-MP:    ${valid_platform.pocketmine ? cli_color.greenBright("Avaible") : cli_color.redBright("Not Avaible")}`,
    "*",
    "**************************************************************"
  ];
  console.log(cli_color.whiteBright(info.join("\n").replace(/true/gi, cli_color.greenBright("true")).replace(/false/gi, cli_color.redBright("false")).replace(/undefined/gi, cli_color.red("undefined"))));
  // End
  return;
}
module.exports.StartServer = StartServer;
module.exports.Yargs = Yargs;
function StartServer(ExitSession = true) {
  const BdsManegerServer = BdsCore.BdsManegerServer.StartServer();
  if (Yargs.parse()["debug"]) console.log(BdsManegerServer.setup_command.command, ...BdsManegerServer.setup_command.args);
  console.log(cli_color.greenBright(`Server started Session UUID: ${BdsManegerServer.uuid}`));
  BdsManegerServer.on("log", data => process.stdout.write(cli_color.blueBright(data)));
  const __readline = readline.createInterface({input: process.stdin, output: process.stdout});
  __readline.on("line", data => BdsManegerServer.SendCommand(data));
  if (process.env.DOCKER_IMAGE !== "true") __readline.on("close", BdsManegerServer.stop);
  BdsManegerServer.on("exit", code => {
    __readline.close();
    console.log(cli_color.redBright(`Bds Core Exit with code ${code}, Uptimed: ${BdsManegerServer.Uptime}`));
    if (ExitSession) process.exit(code);
  });
}
// Load Bds Maneger CLI Plugins
const Plugins = [];
fs.readdirSync(path.join(__dirname, "plugins")).map(file => path.resolve(__dirname, "plugins", file)).filter(Mod => fs.lstatSync(Mod).isFile() && Mod.endsWith(".js")).forEach(Plugin => {
  try {
    require(Plugin);
    Plugins.push(Plugin);
  } catch (err) {
    console.log(cli_color.redBright(`Error loading plugin: ${path.basename(Plugin).replace(/\.js$/gi, "")}`));
    console.log(cli_color.redBright(err));
  }
});
const ProcessArgs = Yargs.help().version(false).parse();
// Async functiona
async function Runner() {
  // ESM Modules
  const ora = (await import("ora")).default;

  // Update Bds Core Platform
  if (ProcessArgs.platform || ProcessArgs.p) {
    if (process.env.DOCKER_IMAGE === "true") {
      try {
        BdsCore.BdsSettings.ChangePlatform(ProcessArgs.platform || ProcessArgs.p);
      } catch (err) {
        console.log(cli_color.redBright(err));
        process.exit(1);
      }
    } else {
      const UpdatePla = ora("Updating Bds Platform").start();
      try {
        BdsCore.BdsSettings.ChangePlatform(ProcessArgs.platform || ProcessArgs.p);
        UpdatePla.succeed(`Now the platform is the ${ProcessArgs.platform || ProcessArgs.p}`);
      } catch (error) {
        UpdatePla.fail(`Unable to update platform to ${ProcessArgs.platform || ProcessArgs.p}`);
        process.exit(1);
      }
    }
  }

  // Print Info about Bds Core and Platforms
  if (ProcessArgs.info || ProcessArgs.i) {
    await info();
    return;
  }

  // Download
  if (ProcessArgs.download || ProcessArgs.d) await DownloadServer(ProcessArgs.download || ProcessArgs.d);

  // Kill
  if (ProcessArgs.kill || ProcessArgs.k) BdsCore.BdsCkeckKill.Kill();

  // Server Proprieties
  // --players ${PLAYERS} --world-name ${WORLD_NAME} --description ${DESCRIPTION} --gamemode ${GAMEMODE} --difficulty ${DIFFICULTY} --level-seed ${LEVEL_SEED}
  const ServerProprieties = BdsCore.BdsServerSettings.get_config();

  if (ProcessArgs["world-name"]) ServerProprieties.world = ProcessArgs["world-name"];
  if (ProcessArgs.description) ServerProprieties.description = ProcessArgs.description;
  if (ProcessArgs.gamemode) ServerProprieties.gamemode = ProcessArgs.gamemode;
  if (ProcessArgs.difficulty) ServerProprieties.difficulty = ProcessArgs.difficulty;
  if (ProcessArgs.players) ServerProprieties.players = ProcessArgs.players;
  // if (ProcessArgs.level_seed) ServerProprieties.level_seed = ProcessArgs.level_seed;

  // Save
  try {BdsCore.BdsServerSettings.config(ServerProprieties);} catch (error) {console.log(error);}

  // Do NOT Start API
  if (!(ProcessArgs["no-api"])) BdsCore.BdsManegerAPI.api();

  // Get Domain
  if (ProcessArgs.get_domain) {
    try {
      const HostInfo = await BdsCore.BdsNetwork.GetHost();
      console.log("Domain:", HostInfo.host);
      process.on("exit", async () => {
        await HostInfo.delete_host();
        console.log("Sucess remove host");
      });
    } catch (err) {
      console.log("Cannot get domain");
    }
  }
  console.log("Token:", BdsCore.BdsToken.GetAllTokens().map(a => a.Token).join("\n"));
  for (let Plgun of Plugins) {
    const { externalStart, name } = require(Plgun);
    if (externalStart) {
      console.log(name || Plgun, "Control Start");
      return;
    }
  }
  return StartServer(true);
}

Runner().catch(err => {
  console.log("Bds Core CLI Crash:", "\n\n", err);
  process.exit(1);
});
