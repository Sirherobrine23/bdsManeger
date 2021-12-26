#!/usr/bin/env node
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds-Manger-CLI";
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;
// Internal Modules
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import Bds Core
const BdsCore = require("../index");

// External Modules
const cli_color = require("cli-color");
const inquirer = require("inquirer");

// Bin Args
const ProcessArgs = require("minimist")(process.argv.slice(2));

// Load Bds Maneger CLI Plugins
const MoreHelp = [];
const BeforeRun = [];
fs.readdirSync(path.join(__dirname, "plugins")).map(file => path.resolve(__dirname, "plugins", file)).filter(Mod => fs.lstatSync(Mod).isFile() && Mod.endsWith(".js")).forEach(Plugin => {
  try {
    const __module = require(Plugin);
    (__module.Args || []).forEach(PluginArg => {
      ["h", "help", "i", "info", "d", "download", "s", "start", "k", "kill", "get_domain", "p", "platform", "n", "no-api"].forEach(Arg => {
        if (PluginArg.arg === Arg) {
          console.log(cli_color.redBright(`${path.basename(Plugin).replace(/\.js$/gi, "")}:`, "Conflicted with Bds Maneger CLI argument"));
          process.exit(12);
        }
      });
      BeforeRun.forEach(Arg => {
        if (PluginArg.arg === Arg) {
          console.log(cli_color.redBright(`${path.basename(Plugin).replace(/\.js$/gi, "")}:`, "Conflicted with another plugin argument"));
          process.exit(13);
        }
      });
      BeforeRun.push(PluginArg);
    });
    MoreHelp.push(cli_color.redBright(`Plugin: ${path.basename(Plugin).replace(/\.js$/gi, "")} - ${__module.description}`), "", ...(__module.help || []), "");
  } catch (err) {
    console.log(cli_color.redBright(`Error loading plugin: ${path.basename(Plugin).replace(/\.js$/gi, "")}`));
    console.log(cli_color.redBright(err));
  }
});

async function DownloadServer(waitUserSelectVersion = "") {
  const ora = (await import("ora")).default;
  const PlatformVersion = await BdsCore.BdsDownload.GetServerVersion();
  if (waitUserSelectVersion === true || !waitUserSelectVersion) waitUserSelectVersion = (await inquirer.prompt({
    type: "list",
    name: "version",
    message: `Select the version to download ${BdsCore.BdsSettings.GetPlatform()}`,
    choices: Object.keys(PlatformVersion.versions).map(version => ({name: `v${version}`, value: version}))
  })).version;
  const RunSpinner = ora("Downloading...").start();
  try {
    const DownloadRes = await BdsCore.BdsDownload.DownloadServer(waitUserSelectVersion);
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

async function help() {
  const help = [
    `Bds Maneger CLI version: ${cli_color.magentaBright(BdsCore.version)}`,
    `System: ${cli_color.yellow(process.platform)}, architecture: ${cli_color.blue(BdsCore.BdsSystemInfo.arch)}`,
    "",
    " Usage: bds-maneger-cli [options]",
    "",
    " Options:",
    "   -h, --help                 Print this help",
    "   -i, --info                 Print info about Bds Maneger Core and Platforms",
    "   -d, --download             Download a server",
    "   -s, --start                Start a server",
    "   -k, --kill                 Kill Server if running",
    "       --get_domain           Get temporary public domain to connect in to server or API",
    "   -p, --platform             Change the platform",
    "   -n, --no-api               Don't start the Bds Maneger API Rest",
    "",
    ...MoreHelp,
    "",
    " Examples:",
    "   bds-maneger-cli -d",
    "   bds-maneger-cli -s",
    "   bds-maneger-cli -sk",
    "   bds-maneger-cli -k",
    "   bds-maneger-cli -p bedrock",
    "   bds-maneger-cli -i",
    "   bds-maneger-cli -h",
    ""
  ];
  console.log(cli_color.whiteBright(help.join("\n").replace(/true/gi, cli_color.greenBright("true")).replace(/false/gi, cli_color.redBright("false")).replace(/undefined/gi, cli_color.red("undefined"))));
  return process.exit(0);
}

async function StartServer() {
  const BdsManegerServer = BdsCore.BdsManegerServer.StartServer();
  BdsManegerServer.on("log", data => process.stdout.write(cli_color.blueBright(data)));
  const __readline = readline.createInterface({input: process.stdin, output: process.stdout});
  __readline.on("line", data => BdsManegerServer.SendCommand(data));
  if (process.env.DOCKER_IMAGE !== "true") __readline.on("close", BdsManegerServer.stop);
  // Get Temporary External Domain
  
  BdsManegerServer.on("exit", code => {
    __readline.close();
    console.log(cli_color.redBright(`Bds Core Exit with code ${code}, Uptimed: ${BdsManegerServer.Uptime}`));
  });
}

// Async functiona
async function Runner() {
  // ESM Modules
  const ora = (await import("ora")).default;

  // Update Bds Core Platform
  if (ProcessArgs.platform || ProcessArgs.p) {
    const UpdatePla = ora("Updating Bds Platform").start();
    try {
      BdsCore.BdsSettings.UpdatePlatform(ProcessArgs.platform || ProcessArgs.p);
      UpdatePla.succeed(`Now the platform is the ${ProcessArgs.platform || ProcessArgs.p}`);
    } catch (error) {
      UpdatePla.fail(`Unable to update platform to ${ProcessArgs.platform || ProcessArgs.p}`);
      process.exit(1);
    }
  }

  // Print Info about Bds Core and Platforms
  if (ProcessArgs.info || ProcessArgs.i) {
    await info();
    return;
  }

  // Help
  if (ProcessArgs.help || ProcessArgs.h) {
    await help();
    return;
  }

  // Download
  if (ProcessArgs.download || ProcessArgs.d) await DownloadServer(ProcessArgs.download || ProcessArgs.d);

  // Kill
  if (ProcessArgs.kill || ProcessArgs.k) BdsCore.BdsCkeckKill.Kill();

  // Load Plugins
  let ControlStartWithPlugin = false;
  for (let Plugin of BeforeRun) {
    if (ProcessArgs[Plugin.arg]) {
      if (Plugin.externalStart === true) ControlStartWithPlugin = true;
      Plugin.main(ProcessArgs[Plugin.arg], ProcessArgs).catch(err => console.log("Plugin Crash:", "\n\n", err));
    }
  }

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

  // Start Server
  if (!(ProcessArgs.start || ProcessArgs.s)) return;
  
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

  if (ControlStartWithPlugin) return;
  return StartServer();
}
module.exports = {
  StartServer
}

if (Object.keys(ProcessArgs).filter(a => a !== "_").length === 0) help();
else {
  Runner();
}
