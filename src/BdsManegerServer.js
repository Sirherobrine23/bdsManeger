const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Backup } = require("./BdsBackup");
const { CronJob } = require("cron");
const BdsSettings = require("../src/lib/BdsSettings");

const PlayerJson = require("./ManegerServer/Players_json");
const BasicCommands = require("./ManegerServer/BasicCommands");

const ServerSessions = {};
module.exports.GetSessions = () => ServerSessions;

const PlayersCallbacks = [];
module.exports.RegisterPlayerGlobalyCallbacks = function RegisterPlayerGlobalyCallbacks(callback){
  PlayersCallbacks.push(callback);
}

module.exports.StartServer = function start() {
  const commandExists = require("../src/lib/commandExist");
  const io = require("./api").SocketIO;
  const CurrentBdsPlatform = BdsSettings.GetPlatform();
  const SetupCommands = {
    RunInCroot: false,
    command: String,
    args: [],
    cwd: String,
    env: {
      ...process.env
    },
  }

  // Minecraft Bedrock Oficial
  if (CurrentBdsPlatform === "bedrock"){
    // Check Darwin Platform
    if (process.platform === "darwin") throw new Error("Use a imagem Docker");

    // Windows Platform
    else if (process.platform === "win32") {
      SetupCommands.command = "bedrock_server.exe";
      SetupCommands.cwd = BdsSettings.GetServerPaths("bedrock")
    }

    // Linux Platform
    else if (process.platform === "linux"){
      // Set Executable file
      try {child_process.execSync("chmod 777 bedrock_server", {cwd: BdsSettings.GetServerPaths("bedrock")});} catch (error) {console.log(error);}

      // Set Env and Cwd
      SetupCommands.cwd = BdsSettings.GetServerPaths("bedrock");
      SetupCommands.env.LD_LIBRARY_PATH = BdsSettings.GetServerPaths("bedrock");

      // In case the cpu is different from x64, the command will use qemu static to run the server
      if (process.arch !== "x64") {
        if (!(commandExists("qemu-x86_64-static"))) throw new Error("Install qemu static")
        SetupCommands.command = "qemu-x86_64-static"
        SetupCommands.args.push("./bedrock_server");
      } else SetupCommands.command = "./bedrock_server";
    } else throw new Error("your system does not support Minecraft Bedrock (yet)")
  }

  // Minecraft Java Oficial
  else if (CurrentBdsPlatform === "java") {
    const JavaConfig = BdsSettings.GetServerSettings("java")

    // Checking if java is installed on the device
    if (commandExists("java")) {
      SetupCommands.cwd = BdsSettings.GetServerPaths("java");
      SetupCommands.command = "java";
      SetupCommands.args.push("-jar", `-Xms${JavaConfig.ram_mb}M`, `-Xmx${JavaConfig.ram_mb}M`, "MinecraftServerJava.jar", "nogui");
    } else throw new Error("Install Java");
  }

  // Spigot
  else if (CurrentBdsPlatform === "spigot") {
    const JavaConfig = BdsSettings.GetServerSettings("java")
    // Checking if java is installed on the device
    if (commandExists("java")) {
      SetupCommands.cwd = BdsSettings.GetServerPaths("spigot");
      SetupCommands.command = "java";
      SetupCommands.args.push("-jar", `-Xms${JavaConfig.ram_mb}M`, `-Xmx${JavaConfig.ram_mb}M`, "spigot.jar", "nogui");
    } else throw new Error("Install Java");
  }

  // Dragonfly
  else if (CurrentBdsPlatform === "dragonfly") {
    SetupCommands.cwd = BdsSettings.GetServerPaths("dragonfly");
    if (process.platform === "win32") {
      SetupCommands.command = "Dragonfly.exe";
    } else {
      SetupCommands.command = "./Dragonfly";
      child_process.execFileSync("chmod", ["a+x", SetupCommands.command], {cwd: SetupCommands.cwd});
    }
  }

  // Minecraft Bedrock (Pocketmine-MP)
  else if (CurrentBdsPlatform === "pocketmine") {
    // Start PocketMine-MP
    SetupCommands.command = path.join(path.resolve(BdsSettings.GetServerPaths("pocketmine"), "bin", "php7", "bin"), "php");
    if (process.platform === "win32") SetupCommands.command = path.join(path.resolve(BdsSettings.GetServerPaths("pocketmine"), "bin/php"), "php.exe");
    SetupCommands.args.push("./PocketMine-MP.phar");
    SetupCommands.cwd = BdsSettings.GetServerPaths("pocketmine");
  }

  // Show Error platform
  else throw Error("Bds Config Error")

  // Setup commands
  let __ServerExec = child_process.exec("exit 0"); // lgtm [js/useless-assignment-to-local]
  if (SetupCommands.RunInCroot) throw new Error("RunInCroot is not supported yet");
  else __ServerExec = child_process.execFile(SetupCommands.command, SetupCommands.args, {
  cwd: SetupCommands.cwd,
    env: SetupCommands.env
  });
  const ServerExec = __ServerExec;

  // Log file
  const LogFile = path.join(BdsSettings.GetPaths("log"), `${BdsSettings.GetPlatform()}_${new Date().toString().replace(/:|\(|\)/g, "_")}_Bds_log.log`);
  const LatestLog_Path = path.join(BdsSettings.GetPaths("log"), "latest.log");
  const LogSaveFunction = data => {
    fs.appendFileSync(LogFile, data);
    fs.appendFileSync(LatestLog_Path, data);
    return data;
  }
  fs.writeFileSync(LatestLog_Path, "");

  // Log File
  ServerExec.stdout.on("data", LogSaveFunction);
  ServerExec.stderr.on("data", LogSaveFunction);

  // Global and Run
  global.bds_log_string = ""
  ServerExec.stdout.on("data", data => {if (global.bds_log_string) global.bds_log_string = data; else global.bds_log_string += data});

  /**
   * Emit command in to the server
   * 
   * @param {string} command
   * @param {Array} command
   */
  const ServerCommand = function (Command = "list") {
    if (!(typeof Command === "string" || typeof Command === "object" && typeof Command.map === "function")) throw new Error("Command must be a string or an array");
    if (typeof Command === "string") {
      ServerExec.stdin.write(`${Command}\n`);
    } else if (typeof Command === "object" && typeof Command.map === "function") {
      Command.filter(a => typeof a === "string").forEach(command => ServerExec.stdin.write(`${command}\n`));
    }
    return;
  };
  /**
   * When a player connects or disconnects, the server will issue an event.
   * 
   * @param {string} Action - The event to listen for.
   * @param {function} Callback - The callback to run when the event is triggered.
   */
  const PlayerAction = function(Action = "all", callback = (PlayerActions = [{Player: "", Action: "connect", Platform: "", xuid: "", Date: ""},{Player: "", Action: "disconnect", Platform: "", xuid: "", Date: ""}]) => console.log(PlayerActions)){
    if (!(Action === "all" || Action === "connect" || Action === "disconnect")) throw new Error("Use some valid Action: all, connect, disconnect");
    const { CreatePlayerJson } = PlayerJson;
    const RunON = data => CreatePlayerJson(data, (PlayerActions) => {
      if (Action !== "all") PlayerActions = PlayerActions.filter(On => On.Action === Action);
      return callback(PlayerActions);
    });
    ServerExec.stdout.on("data", RunON);
    ServerExec.stderr.on("data", RunON);
    return;
  };
  /**
   * Register a function to run when the server issues a log or when it exits.
   * 
   * @param {string} FunctionAction - Action to Register to run callback
   * @callback
   */
  const ServerOn = function (FunctionAction = "log", callback = (data = FunctionAction === "log" ? "" : 0) => console.log(data)) {
    if (!(FunctionAction === "log" || FunctionAction === "exit")) throw new Error("Use some valid FunctionAction: log, exit");
    if (FunctionAction === "log") {
      ServerExec.stdout.on("data", data => callback(data));
      ServerExec.stderr.on("data", data => callback(data));
    } else if (FunctionAction === "exit") ServerExec.on("exit", code => callback(code));
    else throw new Error("Use some valid FunctionAction: log, exit");
    return;
  }

  // Mount commands to Return
  const returnFuntion = {
    uuid: randomUUID(),
    LogPath: LogFile,
    PID: ServerExec.pid,
    Uptime: 0,
    StartTime: new Date(),
    on: ServerOn,
    PlayerAction: PlayerAction,
    SendCommand: ServerCommand,
    ...(BasicCommands.BasicCommands(ServerExec))
  }

  // Uptime Server
  const UptimeCount = setInterval(() => returnFuntion.Uptime++, 1000);
  ServerExec.on("exit", code => {
    delete ServerSessions[returnFuntion.uuid]
    io.emit("ServerExit", {
      UUID: returnFuntion.uuid,
      exitCode: code
    })
    clearInterval(UptimeCount);
  });

  // Socket.io
  io.on("connection", socket => {
    socket.on("ServerCommand", (data) => {
      if (typeof data === "string") return returnFuntion.SendCommand(data);
      else if (typeof data === "object") {
        if (typeof data.uuid === "string") {
          if (data.uuid === returnFuntion.uuid) return returnFuntion.SendCommand(data.command);
        }
      }
      return;
    });
  });
  
  ServerOn("log", data => {
    io.emit("ServerLog", {
      UUID: returnFuntion.uuid,
      data: data
    });
    PlayerJson.CreatePlayerJson(data, async Actions => {
      if (Actions.length === 0) return;
      PlayerJson.UpdateUserJSON(Actions);
      io.emit("PlayerAction", Actions);
      PlayersCallbacks.forEach(async callback => {
        if (typeof callback === "function") return callback(Actions);
      });
    });
  });

  // Return
  ServerSessions[returnFuntion.uuid] = returnFuntion;
  module.exports.BdsRun = returnFuntion;
  return returnFuntion;
}

module.exports.CronBackups = BdsSettings.GetCronBackup().map(Crron => {
  const Cloud_Backup = {
    Azure: require("./clouds/Azure").Uploadbackups,
    Driver: require("./clouds/GoogleDriver").Uploadbackups,
    Oracle: require("./clouds/OracleCI").Uploadbackups,
  }
  //
  return {
    CronFunction: new CronJob(Crron.cron, async () => {
      console.log("Starting Server and World Backup");
      const CurrentBackup = Backup();
      // Azure
      if (Crron.Azure) Cloud_Backup.Azure(CurrentBackup.file_name, CurrentBackup.file_path);
      else console.info("Azure Backup Disabled");

      // Google Driver
      if (Crron.Driver) Cloud_Backup.Driver(CurrentBackup.file_name, CurrentBackup.file_path);
      else console.info("Google Driver Backup Disabled");

      // Oracle Bucket
      if (Crron.Oracle) Cloud_Backup.Oracle(CurrentBackup.file_name, CurrentBackup.file_path);
      else console.info("Oracle Bucket Backup Disabled");
    })
  }
});
