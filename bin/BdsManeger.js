#!/usr/bin/env node
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds-Manger-CLI";
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const BdsCore = require("../src/index");
const cli_color = require("cli-color");
const inquirer = require("inquirer");

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
function StartServer(ExitSession = true) {
  const BdsManegerServer = BdsCore.BdsManegerServer.StartServer();
  console.log(cli_color.greenBright(`Server started Session UUID: ${BdsManegerServer.uuid}`));
  BdsManegerServer.on("log", data => process.stdout.write(cli_color.blueBright(data)));
  const __readline = readline.createInterface({input: process.stdin, output: process.stdout});
  __readline.on("line", data => BdsManegerServer.SendCommand(data));
  if (process.env.DOCKER_IMAGE !== "true") __readline.on("close", BdsManegerServer.stop);
  BdsManegerServer.on("exit", code => {
    __readline.close();
    console.log(cli_color.redBright(`Bds Core Exit with code ${code}, Uptimed: ${BdsManegerServer.Uptime()}`));
    if (ExitSession) process.exit(code);
  });
}
module.exports.StartServer = StartServer;

// Async functiona
async function RenderMainProcess(ProcessArgs = {}, Plugins = []) {
  // ESM Modules
  const ora = (await import("ora")).default;

  // Update Bds Core Platform
  if (ProcessArgs.platform) {
    if (process.env.DOCKER_IMAGE === "true") {
      try {
        BdsCore.BdsSettings.ChangePlatform(ProcessArgs.platform);
      } catch (err) {
        console.log(cli_color.redBright(err));
        process.exit(1);
      }
    } else {
      const UpdatePla = ora("Updating Bds Platform").start();
      try {
        BdsCore.BdsSettings.ChangePlatform(ProcessArgs.platform);
        UpdatePla.succeed(`Now the platform is the ${ProcessArgs.platform}`);
      } catch (error) {
        UpdatePla.fail(`Unable to update platform to ${ProcessArgs.platform}`);
        process.exit(1);
      }
    }
  }

  // Print Info about Bds Core and Platforms
  if (ProcessArgs.info) {
    await info();
    return;
  }

  // Backup
  if (ProcessArgs.backup) {
    const BackupEnd = BdsCore.BdsBackup.Backup();
    BackupEnd.write_file();
    console.log(cli_color.greenBright(`Backup created and saved in ${BackupEnd.file_path}`));
    process.exit(0);
  }

  // Download
  if (ProcessArgs.download) await DownloadServer(ProcessArgs.download);

  // Kill
  if (ProcessArgs.kill) await BdsCore.BdsCkeckKill.Kill();

  // Server Proprieties
  // --players ${PLAYERS} --world-name ${WORLD_NAME} --description ${DESCRIPTION} --gamemode ${GAMEMODE} --difficulty ${DIFFICULTY} --level-seed ${LEVEL_SEED}
  try {
    const ServerProprieties = await BdsCore.BdsServerSettings.get_config();
    if (ProcessArgs["world-name"]) ServerProprieties.world = ProcessArgs["world-name"];
    if (ProcessArgs.description) ServerProprieties.description = ProcessArgs.description;
    if (ProcessArgs.gamemode) ServerProprieties.gamemode = ProcessArgs.gamemode;
    if (ProcessArgs.difficulty) ServerProprieties.difficulty = ProcessArgs.difficulty;
    if (ProcessArgs.players) ServerProprieties.players = ProcessArgs.players;
    await BdsCore.BdsServerSettings.config(ServerProprieties);
  } catch (err) {
    console.log("Cannot Save Config")
  }

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
  if (BdsCore.BdsToken.GetAllTokens().map(a => a.Token).length === 0) BdsCore.BdsToken.CreateToken();
  console.log("Token:", BdsCore.BdsToken.GetAllTokens().map(a => a.Token).join("\n"));
  for (let Plgun of Plugins) {
    const { externalStart, name } = require(Plgun);
    if (externalStart) {
      console.log(name || Plgun, "Control Start");
      return;
    }
  }
  if (!ProcessArgs.auto_update) return StartServer(true);
  else {
    const BdsCoreUrlManeger = require("@the-bds-maneger/server_versions");
    const BdsSettings = require("../src/lib/BdsSettings");
    const BdsBackup = require("../src/BdsBackup");
    const BdsManegerServer = require("../src/ServerManeger");
    const BdsDownload = require("../src/BdsServersDownload");
    const Sleep = async (Seconds = 1) => await new Promise(resolve => setTimeout(resolve, Seconds * 1000));
    console.log("Auto Update Server Software Enabled");
    const Platform = BdsSettings.CurrentPlatorm();
    let TmpVersion = BdsSettings.GetBdsConfig().server.versions[Platform];
    let IsFistStart = false;
    StartServer(false);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        if (IsFistStart) {
          const LatestVersions = (await BdsCoreUrlManeger.listAsync()).latest[Platform];
          if (LatestVersions !== TmpVersion) {
            console.log("New Version:", LatestVersions);
            const Servers = BdsManegerServer.GetSessions();
            for (let session of Servers) {
              try {session.ServerAction.say("AutoUpdate Stop Server");} catch (err) {console.log(err);}
              await session.stop();
            }
            (BdsBackup.Backup()).write_file();
            await BdsDownload.DownloadServer("latest");
            
            StartServer(false);
            TmpVersion = LatestVersions;
          }
        } else IsFistStart = true;
        await Sleep(1000);
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const Yargs = require("yargs").usage("$0 [args]");
Yargs.command("info", "Show info", async () => {
  await info();
  process.exit(0);
});
Yargs.command("start", "Start Bds Core Server", (YargsOpt) => {
  YargsOpt.option("platform", {
    alias: "p",
    describe: "Select BdsManeger Platform available to system and architecture",
    type: "string"
  });
  YargsOpt.option("download", {
    describe: "Download Bds Server",
    type: "string",
    alias: "d",
  });
  YargsOpt.option("kill", {
    alias: "k",
    describe: "Kill Bds Servers",
    type: "boolean",
    default: true
  });
  YargsOpt.option("backup", {
    describe: "Backup Bds Server",
    type: "boolean",
    alias: "b",
    default: false
  });
  YargsOpt.option("get_domain", {
    describe: "Get Domain to connect to the Server",
    type: "boolean",
    default: false
  });
  YargsOpt.option("auto_update", {
    describe: "Enable Auto Update Server",
    alias: "a",
    type: "boolean",
    default: false
  });
  YargsOpt.option("no-api", {
    describe: "Desactivate BdsManeger API",
    type: "boolean",
    default: false
  });
  // World Options
  YargsOpt.option("world-name", {
    describe: "World Name, (Some platforms do not accept spaces)",
    type: "string"
  });
  YargsOpt.option("description", {
    describe: "World Description",
    type: "string"
  });
  YargsOpt.option("gamemode", {
    describe: "Default Server Gamemode",
    type: "string"
  });
  YargsOpt.option("difficulty", {
    describe: "Default Server Difficulty",
    type: "string"
  });
  YargsOpt.option("players", {
    describe: "Max Players to Connect to the Server",
    type: "number",
    default: 15
  });
  YargsOpt.option("Develop", {
    describe: "Develop Mode",
    type: "boolean",
    default: false
  });
  module.exports.Yargs = YargsOpt;
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
  const YargsOptArg = YargsOpt.help().version(false).parse();
  if (YargsOptArg.Develop) process.env.NODE_ENV = "development";
  else {
    process.env.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : "production";
  }
  return RenderMainProcess({
    download: YargsOptArg.download || YargsOptArg.d,
    kill: YargsOptArg.kill || YargsOptArg.k,
    auto_update: YargsOptArg.auto_update || YargsOptArg.a,
    backup: YargsOptArg.backup || YargsOptArg.b,
    get_domain: YargsOptArg.get_domain,
    "no-api": YargsOptArg["no-api"],
    platform: YargsOptArg.platform || YargsOptArg.p,
    "world-name": YargsOptArg["world-name"],
    description: YargsOptArg.description,
    gamemode: YargsOptArg.gamemode,
    difficulty: YargsOptArg.difficulty,
    players: YargsOptArg.players
  }, Plugins).catch(err => {
    console.log(cli_color.redBright(String(err.stack || err)));
    process.exit(1);
  });
});
Yargs.version(false).help(true).parse();