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

  // sets bds core commands
  const log = function (logCallback){
    if (typeof logCallback !== "function") throw new Error("Log Callback is not a function");
    ServerExec.stdout.on("data", data => logCallback(data));
    ServerExec.stderr.on("data", data => logCallback(data));
  };
  const exit = function (exitCallback = process.exit){if (
    typeof exitCallback === "function") ServerExec.on("exit", code => exitCallback(code));
  };
  const on = function(action = String, callback = Function) {
    if (!(action === "all" || action === "connect" || action === "disconnect")) throw new Error("Use some valid action: all, connect, disconnect");
    
    // Functions
    const data = data => PlayerJson.UpdateUserJSON(data, function (array_status){
      array_status.filter(On => {if ("all" === action || On.Action === action) return true; else return false;}).forEach(_player => callback(_player))
    });
    ServerExec.stdout.on("data", data);
    ServerExec.stderr.on("data", data);
  };
  const command = function (command = "list") {
    ServerExec.stdin.write(`${command}\n`);
    return command;
  };
  
  const BasicCo = BasicCommands.BasicCommands(ServerExec);

  // Mount commands to Return
  const returnFuntion = {
    uuid: randomUUID(),
    LogPath: LogFile,
    pid: ServerExec.pid,
    uptime: 0,
    StartTime: (new Date()),
    ...BasicCo,
    command, log, exit, on
  }

  // Uptime Server
  const OnStop = setInterval(() => returnFuntion.uptime = (new Date().getTime() - returnFuntion.StartTime.getTime()) / 1000, 1000);
  ServerExec.on("exit", () => {
    delete ServerSessions[returnFuntion.uuid]
    clearInterval(OnStop);
  });

  // Socket.io
  io.on("connection", socket => {
    socket.on("ServerCommand", (data) => {
      if (typeof data === "string") return returnFuntion.command(data);
      else if (typeof data === "object") {
        if (typeof data.uuid === "string") {
          if (data.uuid === returnFuntion.uuid) return returnFuntion.command(data.command);
        }
      }
      return;
    });
  });
  ServerExec.on("exit", code => io.emit("ServerExit", {
    UUID: returnFuntion.uuid,
    exitCode: code
  }));
  ServerExec.stdout.on("data", (data = "") => {
    io.emit("ServerLog", {
      UUID: returnFuntion.uuid,
      data: data,
      IsStderr: false
    });
  });
  ServerExec.stderr.on("data", (data = "") => {
    io.emit("ServerLog", {
      UUID: returnFuntion.uuid,
      data: data,
      IsStderr: true
    });
  });

  // Player JSON File
  ServerExec.stdout.on("data", data => PlayerJson.CreatePlayerJson(data, Actions => {
    PlayerJson.UpdateUserJSON(Actions);
    io.emit("PlayerAction", Actions);
  }));
  ServerExec.stderr.on("data", data => PlayerJson.CreatePlayerJson(data, Actions => {
    PlayerJson.UpdateUserJSON(Actions);
    io.emit("PlayerAction", Actions);
  }));

  // Return
  ServerSessions[returnFuntion.uuid] = returnFuntion;
  module.exports.BdsRun = returnFuntion;
  return returnFuntion;
}

// Search player in JSON
module.exports.Player_Search = function Player_Search(player = "dontSteve") {
  const Player_Json_path = BdsSettings.GetPaths("player"), Current_platorm = BdsSettings.GetPlatform();
  const Players_Json = JSON.parse(fs.readFileSync(Player_Json_path, "utf8"))[Current_platorm]
  for (let Player of Players_Json) {
    if (Player.Player === player.trim()) return Player;
  }
  return {};
}

module.exports.GetFistSession = function GetFistSession(){
  const ArraySessions = Object.getOwnPropertyNames(ServerSessions)
  if (ArraySessions.length === 0) throw "Start Server";
  return ServerSessions[0]
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
