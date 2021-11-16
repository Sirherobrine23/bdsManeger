#!/usr/bin/env node
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds-Manger-CLI";
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;
// Internal Modules
const fs = require("fs");
const path = require("path");

// External Modules
const cli_color = require("cli-color");
const inquirer = require("inquirer");

// Bin Args
const ProcessArgs = require("minimist")(process.argv.slice(2));

// Import Bds Core
const BdsCore = require("../index");
const BdsNetwork = require("../src/BdsNetwork");
const commandExits = require("../lib/commandExist");
const readline = require("readline");
const { PlatformVersionsV2 } = require("../src/BdsServersDownload");
const { GetPlatform } = require("../lib/BdsSettings");

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
      MoreHelp.push(cli_color.redBright(`${path.basename(Plugin).replace(/\.js$/gi, "")} - ${__module.description}`), "", ...(__module.help || []), "");
    });
  } catch (err) {
    console.log(cli_color.redBright(`Error loading plugin: ${Plugin}`));
    console.log(cli_color.redBright(err));
  }
});

async function DownloadServer() {
  const ora = (await import("ora")).default;
  const PlatformVersion = await PlatformVersionsV2()
  const waitUserSelectVersion = (await inquirer.prompt({
    type: "list",
    name: "version",
    message: `Select the version to download ${GetPlatform()}`,
    choices: Object.keys(PlatformVersion.versions).map(version => ({name: `v${version}`, value: version}))
  })).version;
  const RunSpinner = ora("Downloading...").start();
  try {
    const DownloadRes = await BdsCore.download(waitUserSelectVersion);
    RunSpinner.succeed(`Downloaded ${DownloadRes.version}, Published in ${DownloadRes.data.getDate()}/${DownloadRes.data.getMonth()}/${DownloadRes.data.getFullYear()}`);
  } catch (err) {
    RunSpinner.fail(String(err));
    process.exit(1);
  }
}

async function info() {
  const { valid_platform } = await (require("../lib/BdsSystemInfo"))();
  var checkothearch = "";
  if (process.platform === "linux" && BdsCore.arch !== "x64"){checkothearch = `qemu-x86_64-static is installed to emulate an x64 system: ${commandExits("qemu-x86_64-static")}\n`}
  if (process.platform === "android" && BdsCore.arch !== "x64"){checkothearch = `qemu-x86_64 is installed to emulate an x64 system: ${commandExits("qemu-x86_64")}\n`}
  const info = [
      `Bds Maneger Core And Bds Maneger CLI version: ${cli_color.magentaBright(BdsCore.package_json.version)}`,
      `System: ${cli_color.yellow(process.platform)}, architecture: ${cli_color.blue(BdsCore.arch)}`,
      checkothearch,
      "**************************************************************",
      "* Servers currently available:",
      `*   - Bedrock:          ${valid_platform.bedrock}`,
      `*   - Java and Spigot:  ${valid_platform.java ? cli_color.green("Available") : cli_color.red("Needs Java installed https://upstream.bdsmaneger.com/docs/Java?Installer=info")}`,
      `*   - Dragonfly:        ${valid_platform.dragonfly}`,
      `*   - Pocketmine-MP:    ${valid_platform.pocketmine}`,
      "*",
      "**************************************************************"
  ];
  console.log(cli_color.whiteBright(info.join("\n").replace(/true/gi, cli_color.greenBright("true")).replace(/false/gi, cli_color.redBright("false")).replace(/undefined/gi, cli_color.red("undefined"))));
  // End
  return;
}

async function help() {
  const help = [
    `Bds Maneger CLI version: ${cli_color.magentaBright(BdsCore.package_json.version)}`,
    `System: ${cli_color.yellow(process.platform)}, architecture: ${cli_color.blue(BdsCore.arch)}`,
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

// Async functiona
async function Runner() {
  // ESM Modules
  const ora = (await import("ora")).default;

  // Update Bds Core Platform
  if (ProcessArgs.platform || ProcessArgs.p) {
    const UpdatePla = ora("Updating Bds Platform").start();
    try {
      BdsCore.platform_update(ProcessArgs.platform || ProcessArgs.p);
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
  if (ProcessArgs.download || ProcessArgs.d) await DownloadServer();

  // Start Server
  if (!(ProcessArgs.start || ProcessArgs.s)) return;

  // Get Temporary External Domain
  if (ProcessArgs.get_domain) {
    try {
      const HostInfo = await BdsNetwork.GetHost();
      console.log("Domain:", HostInfo.host);
      process.on("exit", async () => {
        await HostInfo.delete_host();
        console.log("Sucess remove host");
      });
    } catch (err) {
      console.log("Cannot get domain");
    }
  }

  // Load Plugins
  for (let Plugin of BeforeRun) {
    if (!(ProcessArgs[Plugin.arg])) Plugin.main(ProcessArgs[Plugin.arg], ProcessArgs).catch(err => console.log("Plugin Crash:", "\n\n", err));
  }

  const BdsManegerServer = BdsCore.start();
  BdsManegerServer.log(data => console.log(cli_color.blueBright(data.replace(/\n$/gi, ""))));
  BdsManegerServer.exit(code => {
      console.log(cli_color.redBright(`Bds Core Exit with code ${code}, Uptimed: ${BdsManegerServer.uptime}`));
      process.exit(code);
  });
  if (!(ProcessArgs["no-api"])) BdsCore.api();
  const __readline = readline.createInterface({input: process.stdin, output: process.stdout});
  __readline.on("line", data => BdsManegerServer.command(data));
}
Runner();
