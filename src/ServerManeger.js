const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const Crypto = require("crypto");
const BdsSettings = require("./lib/BdsSettings");
const Players_json = require("./ManegerServer/Players_json");
const { PlayersJsonExample } = Players_json

const PlayersCallbacks = [];
module.exports.RegisterPlayerGlobalyCallbacks = (callback = () => {}) => PlayersCallbacks.push(callback);

const BackendServerManeger = {
  ServerSessions: []
};
/**
 * Get All sever Sessions
 * 
 * @returns {Array<{
 *  uuid: string
 *  LogPath: string
 *  StartTime: Date
 *  on: (Action: "log"|"exit", Callback: (data: String|number)) => void
 *  PlayerAction: (Action: "connect"|"disconect"|"all", Callback: (data: PlayersJsonExample) => {}) => void
 *  stop: Promise<() => number>
 *  SendCommand: (Data: String) => void
 *  Uptime: () => number
 *  Players_in_Session: void
 *  ServerAction: {
 *    op: (player: String) => void
 *    deop: (player: String) => void
 *    ban: (player: String) => void
 *    kick: (player: String) => void
 *    tp: (player: string, cord: {x: number y: number z: number }) => void
 *    say: (text: String) => void
 *  }
 * }>} 
 */
module.exports.GetSessions = () => BackendServerManeger.ServerSessions;

/**
 * Inicialize the server
 */
function StartServer() {
  const commandExists = require("./lib/commandExist").commdExistSync;
  const io = require("./api").SocketIO;
  const CurrentBdsPlatform = BdsSettings.CurrentPlatorm();
  const SetupCommands = {
    RunInCroot: false,
    command: "",
    args: [],
    cwd: "",
    env: {...process.env}
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
      // Set Env and Cwd
      SetupCommands.cwd = BdsSettings.GetPaths("bedrock", true);
      SetupCommands.env.LD_LIBRARY_PATH = BdsSettings.GetPaths("bedrock", true);
      
      // Set Executable file
      child_process.execSync("chmod 777 bedrock_server", {cwd: SetupCommands.cwd});

      // In case the cpu is different from x64, the command will use qemu static to run the server
      if (process.arch !== "x64") {
        if (!(commandExists("qemu-x86_64-static"))) throw new Error("Install qemu static")
        SetupCommands.command = "qemu-x86_64-static"
        SetupCommands.args.push("./bedrock_server");
      } else SetupCommands.command = "./bedrock_server";
    } else throw new Error("your system does not support Minecraft Bedrock (yet)")
  }

  // Minecraft Java Oficial and Spigot
  else if (CurrentBdsPlatform === "java" || CurrentBdsPlatform === "spigot") {
    const JavaConfig = BdsSettings.GetBdsConfig("java").server.Settings.java;
    // Checking if java is installed on the device
    if (commandExists("java")) {
      SetupCommands.cwd = BdsSettings.GetPaths("java", true);
      SetupCommands.command = "java";
      SetupCommands.args.push("-jar");
      if (CurrentBdsPlatform === "java") SetupCommands.args.push(`-Xms${JavaConfig.ram||1024}M`, `-Xmx${JavaConfig.ram||1024}M`, "MinecraftServerJava.jar", "nogui");
      else SetupCommands.args.push("spigot.jar");
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
    SetupCommands.cwd = BdsSettings.GetPaths("pocketmine", true);
    SetupCommands.command = path.join(path.resolve(BdsSettings.GetPaths("pocketmine", true), "bin", "php7", "bin"), "php");
    if (process.platform === "win32") SetupCommands.command = path.join(path.resolve(BdsSettings.GetPaths("pocketmine", true), "bin/php"), "php.exe");
    if (/linux|android/.test(process.platform)) child_process.execFileSync("chmod", ["a+x", SetupCommands.command]);
    SetupCommands.args.push("./PocketMine-MP.phar");
  }

  // Show Error platform
  else throw Error("Bds Config Error")

  // Setup commands
  const ServerExec = child_process.execFile(SetupCommands.command, SetupCommands.args, {
    cwd: SetupCommands.cwd,
    env: SetupCommands.env
  });

  // Log file
  const LogFolderPath = BdsSettings.GetPaths("Log") || BdsSettings.GetPaths("log");
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

  // Mount commands to Return
  const SessionUUID = Crypto.randomUUID();
  

  // Uptime Server
  let UptimeNumber = 0;
  const UptimeCount = setInterval(() => UptimeNumber++, 1000);
  

  /**
   * Emit command in to the server
   * 
   * @param {string} command
   * @param {Array} command
   */
  function SendCommand(Command = "list") {
    if (!(typeof Command === "string" || typeof Command === "object" && typeof Command.map === "function")) throw new Error("Command must be a string or an array");
    if (typeof Command === "string") {
      ServerExec.stdin.write(`${Command}\n`);
    } else if (typeof Command === "object" && typeof Command.map === "function") {
      Command.filter(a => typeof a === "string").forEach(command => ServerExec.stdin.write(`${command}\n`));
    }
    return;
  }
  

  /**
   * Register a function to run when the server issues a log or when it exits.
   * 
   * @param {string} FunctionAction - Action to Register to run callback
   * @callback
   */
  function OnCallbacks(FunctionAction = "log", callback = (data = FunctionAction === "log" ? "" : 0) => console.log(data)) {
    if (!(FunctionAction === "log" || FunctionAction === "exit")) throw new Error("Use some valid FunctionAction: log, exit");
    if (FunctionAction === "log") {
      ServerExec.stdout.on("data", data => callback(data));
      ServerExec.stderr.on("data", data => callback(data));
    } else if (FunctionAction === "exit") ServerExec.on("exit", code => callback(code));
    else throw new Error("Use some valid FunctionAction: log, exit");
  }
  

  /**
   * Any type of event that can be logged on the server, this is not a log.
   * 
   * @param {string} Action - The event to listen for.
   * @param {function} Callback - The callback to run when the event is triggered.
   */
  function SessionPlayerAction(Action = "all", Callback = (PlayerActions = PlayersJsonExample) => console.log(PlayerActions)){
    if (typeof Callback !== "function") throw new Error("Callback must be a function");
    if (!(Action === "all" || Action === "connect" || Action === "disconnect")) throw new Error("Use some valid Action: all, connect, disconnect");
    OnCallbacks("log", async data => {
      const PlayersActions = await Players_json.Promise_CreatePlayerJson(data, CurrentBdsPlatform);
      if (PlayersActions.length === 0) return;
      return Callback(PlayersActions.filter(PlayersActions => {
        if (Action === "all") return true;
        else if (Action === "connect" && PlayersActions.Action === "connect") return true;
        else if (Action === "disconnect" && PlayersActions.Action === "disconnect") return true;
        else return false;
      }));
    });
  }
  
  /**
   * Stop the server
   */
  async function SessionStop(){
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
    const Code = await new Promise(resolve => OnCallbacks("exit", resolve));
    return Number(Code);
  }
  
  
  /**
   * Op a player
   */
  function SessionOp(player = "Steve") {
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
  }

  /**
   * Deop a player
   */
  function SessionDeop(player = "Steve") {
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
  }

  /**
   * Ban a player
   */
  function SessionBan(player = "Steve") {
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
  }

  /**
   * Kick a player
   */
  function SessionKick(player = "Steve", text = "you got kicked") {
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
  }

  /**
   * Teleport a player
   */
  function SessionTp(player = "Steve", cord = {x: 0, y: 128, z: 0}) {
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
  }

  /**
   * Send text to Server
   */
  function SessionSay(text = ""){
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

  ServerExec.on("exit", code => {
    BackendServerManeger.ServerSessions = BackendServerManeger.ServerSessions.filter(Session => Session.uuid !== SessionUUID);
    io.emit("ServerExit", {
      UUID: SessionUUID,
      exitCode: code
    });
    clearInterval(UptimeCount);
  });

  // Socket.io
  io.on("connection", socket => {
    try {
      socket.emit("ServerLog", {
        UUID: SessionUUID,
        data: fs.readFileSync(SessionReturn.LogPath, "utf8")
      });
    } catch (err) {
      console.log(err);
    }
    socket.on("ServerCommand", (data) => {
      if (typeof data === "string") return SessionReturn.SendCommand(data);
      else if (typeof data === "object") {
        if (typeof data.uuid === "string") {
          if (data.uuid === SessionUUID) return SessionReturn.SendCommand(data.command);
        }
      }
      return;
    });
  });
  
  /**
   * Player Session
   */
  const PlayerSession = {};
  OnCallbacks("log", data => {
    io.emit("ServerLog", {
      UUID: SessionUUID,
      data: data
    });
    Players_json.Promise_CreatePlayerJson(data, CurrentBdsPlatform).then(async Actions => {
      if (typeof Actions !== "object") return;
      if (Actions.length === 0) return;
      Players_json.UpdateUserJSON(Actions);
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

  /**
   * Get Player connectes or not in the server.
   * 
   * @returns {Object<string,{
   *  connected: boolean,
   *  history: Array<{
   *   Action: string,
   *   Date: string
   *  }>
   * }>}
   */
  const Players_in_Session = () => PlayerSession;
  // Return
  const SessionReturn = {
    uuid: SessionUUID,
    LogPath: LogFile,
    StartTime: new Date(),
    on: OnCallbacks,
    PlayerAction: SessionPlayerAction,
    stop: SessionStop,
    SendCommand: SendCommand,
    Uptime: () => UptimeNumber,
    Players_in_Session: Players_in_Session,
    ServerAction: {
      op: SessionOp,
      deop: SessionDeop,
      ban: SessionBan,
      kick: SessionKick,
      tp: SessionTp,
      say: SessionSay,
    },
  }
  BackendServerManeger.ServerSessions.push(SessionReturn);
  return SessionReturn;
}
module.exports.StartServer = StartServer;