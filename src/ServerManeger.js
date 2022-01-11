const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const BdsSettings = require("./lib/BdsSettings");

const PlayersCallbacks = [];
let ServerSessions = {
  "": {
    stop: () => "stop" | "process",
    op: (player = "") => String(player),
    deop: (player = "") => String(player),
    ban: (player = "") => String(player),
    kick: (player = "", text = "") => String(player) + " " + String(text),
    SendCommand: (Command = "") => {String(Command)}
  }
}; ServerSessions = {};

const PlayerJson = require("./ManegerServer/Players_json");
function StartServer() {
  const commandExists = require("./lib/commandExist");
  const io = require("./api").SocketIO;
  const CurrentBdsPlatform = BdsSettings.CurrentPlatorm();
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
      SetupCommands.cwd = BdsSettings.GetPaths("bedrock", true)
    }

    // Linux Platform
    else if (process.platform === "linux"){
      // Set Executable file
      try {child_process.execSync("chmod 777 bedrock_server", {cwd: BdsSettings.GetPaths("bedrock", true)});} catch (error) {console.log(error);}

      // Set Env and Cwd
      SetupCommands.cwd = BdsSettings.GetPaths("bedrock", true);
      SetupCommands.env.LD_LIBRARY_PATH = BdsSettings.GetPaths("bedrock", true);

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
      SetupCommands.cwd = BdsSettings.GetPaths("java", true);
      SetupCommands.command = "java";
      SetupCommands.args.push("-jar", `-Xms${JavaConfig.ram_mb}M`, `-Xmx${JavaConfig.ram_mb}M`, "MinecraftServerJava.jar", "nogui");
    } else throw new Error("Install Java");
  }

  // Spigot
  else if (CurrentBdsPlatform === "spigot") {
    const JavaConfig = BdsSettings.GetServerSettings("java")
    // Checking if java is installed on the device
    if (commandExists("java")) {
      SetupCommands.cwd = BdsSettings.GetPaths("spigot", true);
      SetupCommands.command = "java";
      SetupCommands.args.push("-jar", `-Xms${JavaConfig.ram_mb}M`, `-Xmx${JavaConfig.ram_mb}M`, "spigot.jar", "nogui");
    } else throw new Error("Install Java");
  }

  // Dragonfly
  else if (CurrentBdsPlatform === "dragonfly") {
    SetupCommands.cwd = BdsSettings.GetPaths("dragonfly", true);
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
    SetupCommands.command = path.join(path.resolve(BdsSettings.GetPaths("pocketmine", true), "bin", "php7", "bin"), "php");
    if (process.platform === "win32") SetupCommands.command = path.join(path.resolve(BdsSettings.GetPaths("pocketmine", true), "bin/php"), "php.exe");
    SetupCommands.args.push("./PocketMine-MP.phar");
    SetupCommands.cwd = BdsSettings.GetPaths("pocketmine", true);
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
  const LogFolderPath = BdsSettings.GetPaths("Log") || BdsSettings.GetPaths("log");
  console.log(LogFolderPath);
  const LogFile = path.join(LogFolderPath, `${BdsSettings.CurrentPlatorm()}_${new Date().toString().replace(/:|\(|\)/g, "_")}_Bds_log.log`),
    LatestLog_Path = path.join(LogFolderPath, "latest.log"),
    LogSaveFunction = data => {
      fs.appendFileSync(LogFile, data);
      fs.appendFileSync(LatestLog_Path, data);
      return data;
    };
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

  const stop = async function (){
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write("stop\n");
    } else if (CurrentBdsPlatform === "dragonfly") {
      ServerExec.kill("SIGKILL");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write("stop\n");
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write("stop\n");
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write("stop\n");
    } else throw new Error("Bds Core Bad Config Error");
    const Code = await new Promise(resolve => ServerOn("exit", resolve));
    return Number(Code);
  };
  const op = function (player = "Steve") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`op "${player}"\n`);
      return "op";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`op ${player}\n`);
      return "op";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`op ${player}\n`);
      return "op";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`op ${player}\n`);
      return "op";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const deop = function (player = "Steve") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`deop "${player}"\n`);
      return "deop";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`deop ${player}\n`);
      return "deop";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`deop ${player}\n`);
      return "deop";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`deop ${player}\n`);
      return "deop";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const ban = function (player = "Steve") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`kick "${player}"\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`ban ${player}\n`);
      return "ban";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`ban ${player}\n`);
      return "ban";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`ban ${player}\n`);
      return "ban";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const kick = function (player = "Steve", text = "you got kicked") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`kick "${player}" ${text}\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`kick ${player} ${text}\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`kick ${player} ${text}\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`kick ${player} ${text}\n`);
      return "kick";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const tp = function (player = "Steve", cord = {x: 0, y: 128, z: 0}) {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else throw new Error("Bds Core Bad Config Error");
  };
  function say(text = ""){
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else throw new Error("Bds Core Bad Config Error");
  }

  // Mount commands to Return
  const returnFuntion = {
    uuid: randomUUID(),
    setup_command: SetupCommands,
    LogPath: LogFile,
    PID: ServerExec.pid,
    Uptime: 0,
    StartTime: new Date(),
    on: ServerOn,
    PlayerAction: PlayerAction,
    SendCommand: ServerCommand,
    stop, op, deop, ban, kick, tp, say
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
    try {
      socket.emit("ServerLog", {
        UUID: returnFuntion.uuid,
        data: fs.readFileSync(returnFuntion.LogPath, "utf8")
      });
    } catch (err) {
      console.log(err);
    }
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
  
  const PlayerSession = {};
  returnFuntion.Players_in_Session = () => PlayerSession;
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
      console.log(Actions);
      Actions.forEach(UseAction => {
        const { Player, Action, Date } = UseAction;
        if (PlayerSession[Player] === undefined) {
          PlayerSession[Player] = {
            connected: Action === "connect",
            history: [
              {
                Action,
                Date
              }
            ]
          }
        } else {
          PlayerSession[Player].connected = Action === "connect";
          PlayerSession[Player].history.push({
            Action,
            Date
          });
        }
      });
    });
  });

  // Return
  ServerSessions[returnFuntion.uuid] = returnFuntion;
  return returnFuntion;
}

module.exports = {
  StartServer: StartServer,
  GetSessions: () => ServerSessions,
  GetSessionsArray: () => Object.keys(ServerSessions).map(key => ServerSessions[key]),
  RegisterPlayerGlobalyCallbacks: function RegisterPlayerGlobalyCallbacks(callback){
    PlayersCallbacks.push(callback);
  },
}