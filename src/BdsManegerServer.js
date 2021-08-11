const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolve, join } = require("path");
const randomUUID = require("uuid").v4;
const { CronJob } = require("cron");
const { GetCronBackup } = require("../lib/BdsSettings");
const { Backup } = require("./BdsBackup");

// Bds Maneger Inports
const commandExists = require("../lib/commandExist");
const BdsDetect = require("./CheckKill").Detect;
const bds = require("../index");
const { GetServerPaths, GetPaths, GetServerSettings, GetPlatform } = require("../lib/BdsSettings");
const BdsInfo = require("../BdsManegerInfo.json");

// Set bdsexec functions
global.BdsExecs = {};

function start() {
    if (BdsDetect()){let ErrorReturn = "You already have a server running"; console.warn(ErrorReturn); throw new Error(ErrorReturn);}

    const SetupCommands = {
        command: String,
        args: [],
        cwd: String,
        env: process.env,
    }

    // Minecraft Bedrock Oficial
    if (GetPlatform() === "bedrock"){
        // Check Darwin Platform
        if (process.platform === "darwin") throw new Error("Use a imagem Docker");

        // Windows Platform
        else if (process.platform === "win32") {
            SetupCommands.command = "bedrock_server.exe";
            SetupCommands.cwd = GetServerPaths("bedrock")
        }

        // Linux Platform
        else if (process.platform === "linux"){
            // Set Executable file
            try {child_process.execSync("chmod 777 bedrock_server", {cwd: GetServerPaths("bedrock")});} catch (error) {console.log(error);}

            // Set Env and Cwd
            SetupCommands.cwd = GetServerPaths("bedrock");
            SetupCommands.env.LD_LIBRARY_PATH = GetServerPaths("bedrock");
            
            // In case the cpu is different from x64, the command will use qemu static to run the server
            if (process.arch !== "x64") {
                if (!(commandExists("qemu-x86_64-static"))) throw new Error("Install qemu static")
                SetupCommands.command = "qemu-x86_64-static"
                SetupCommands.args.push("./bedrock_server");
            } else SetupCommands.command = "./bedrock_server";
        } else throw new Error("your system does not support Minecraft Bedrock (yet)")
    }

    // Minecraft Java Oficial
    else if (GetPlatform() === "java") {
        const JavaConfig = GetServerSettings("java")

        // Checking if java is installed on the device
        if (commandExists("java")) {
            SetupCommands.cwd = GetServerPaths("java");
            SetupCommands.command = "java";
            SetupCommands.args.push("-jar", `-Xms${JavaConfig.ram_mb}M`, `-Xmx${JavaConfig.ram_mb}M`, "MinecraftServerJava.jar", "nogui");
        } else {require("open")(bds.package_json.docs_base + "Java-Download#windows"); throw new Error(`Open: ${bds.package_json.docs_base + "Java-Download#windows"}`)}
    }
    
    // Minecraft Bedrock (Pocketmine-MP)
    else if (GetPlatform() === "pocketmine") {
        // Start PocketMine-MP
        SetupCommands.command = join(resolve(GetServerPaths("pocketmine"), "bin", "php7", "bin"), "php");
        SetupCommands.args.push("./PocketMine-MP.phar");
        SetupCommands.cwd = GetServerPaths("pocketmine");
    }
    
    // Minecraft Bedrock (JSPrismarine)
    else if (GetPlatform() === "jsprismarine") {
        // Start JSPrismarine
        SetupCommands.command = "node";
        SetupCommands.args.push("./packages/server/dist/Server.js");
        SetupCommands.cwd = GetServerPaths("jsprismarine");
    } else throw Error("Bds Config Error")
    
    // Setup commands
    const ServerExec = child_process.execFile(SetupCommands.command, SetupCommands.args, {
        cwd: SetupCommands.cwd,
        env: SetupCommands.env
    });
    
    // Post Start
    if (GetPlatform() === "java") {
        const eula_file = path.join(GetServerPaths("java"), "eula.txt");
        console.log(fs.readFileSync(eula_file, "utf8"));
        if (fs.readFileSync(eula_file, "utf8").includes("eula=false")) {
            fs.writeFileSync(eula_file, fs.readFileSync(eula_file, "utf8").replaceAll("eula=false", "eula=true"));
            throw new Error("Restart application/CLI")
        }
    }
    
    // Log file
    
    const LogFile = join(GetPaths("log"), `${bds.date()}_${GetPlatform()}_Bds_log.log`);
    const LatestLog_Path = path.join(GetPaths("log"), "latest.log");
    const LogSaveFunction = data => {
        fs.appendFileSync(LogFile, data);
        fs.appendFileSync(LatestLog_Path, data);
        return data;
    }
    fs.writeFileSync(LatestLog_Path, "");
    
    // Player JSON File
    ServerExec.stdout.on("data", data => Player_Json(data, UpdateUserJSON));
    ServerExec.stderr.on("data", data => Player_Json(data, UpdateUserJSON));
    
    // Log File
    ServerExec.stdout.on("data", LogSaveFunction);
    ServerExec.stderr.on("data", LogSaveFunction);

    // Global and Run
    global.bds_log_string = ""
    ServerExec.stdout.on("data", data => {if (global.bds_log_string) global.bds_log_string = data; else global.bds_log_string += data});

    const returnFuntion = {
        uuid: randomUUID(),
        stop: function (){
            ServerExec.stdin.write(BdsInfo.Servers[GetPlatform()].stop+"\n");
            return BdsInfo.Servers[GetPlatform()].stop;
        },
        command: async function (command = "list", callback = data => console.log(data)){
            return new Promise((resolve) => {
                ServerExec.stdin.write(`${command}\n`);
                if (typeof callback === "function") {
                    const TempLog = []
                    const ControlTempHost = data => {TempLog.push(data); return data;}
                    ServerExec.stdout.on("data", data => ControlTempHost(data));
                    ServerExec.stderr.on("data", data => ControlTempHost(data));
                    setTimeout(() => {
                        callback(TempLog.join("\n"));
                        resolve(TempLog.join("\n"));
                    }, 2500);
                }
            });
        },
        log: function (logCallback = function(data = ""){data.split("\n").filter(d=>{return (d !== "")}).forEach(l=>console.log(l))}){
            if (typeof logCallback !== "function") {
                console.warn("The log callback is not a function using console.log");
                logCallback = function(data = ""){data.split("\n").filter(d=>{return (d !== "")}).forEach(l=>console.log(l))}
            }
            ServerExec.stdout.on("data", data => logCallback(data));
            ServerExec.stderr.on("data", data => logCallback(data));
        },
        exit: function (exitCallback = process.exit){if (
            typeof exitCallback === "function") ServerExec.on("exit", code => exitCallback(code));
        },
        on: function(action = String(), callback = Function) {
            if (!(action === "all" || action === "connect" || action === "disconnect")) throw new Error("Use some valid action: all, connect, disconnect");

            // Functions
            const data = data => Player_Json(data, function (array_status){
                for (let _player of array_status) {
                    if (action === "all") callback(_player);
                    else if (_player.Action === action) callback(_player)
                }
            });
            ServerExec.stdout.on("data", data);
            ServerExec.stderr.on("data", data);
        },
        op: function (player = "Steve") {
            let command = BdsInfo.Servers[GetPlatform()].op.replace("{{Player}}", player);
            ServerExec.stdin.write(command+"\n");
            return command;
        },
        deop: function (player = "Steve") {
            let command = BdsInfo.Servers[GetPlatform()].deop.replace("{{Player}}", player);
            ServerExec.stdin.write(command+"\n");
            return command;
        },
        ban: function (player = "Steve") {
            let command = BdsInfo.Servers[GetPlatform()].ban.replace("{{Player}}", player);
            ServerExec.stdin.write(command+"\n");
            return command;
        },
        kick: function (player = "Steve", text = "you got kicked") {
            let command = BdsInfo.Servers[GetPlatform()].kick.replace("{{Player}}", player).replace("{{Text}}", text);
            ServerExec.stdin.write(command+"\n");
            return command;
        },
        tp: function (player = "Steve", cord = {x: 0, y: 128, z: 0}) {
            let command = BdsInfo.Servers[GetPlatform()].tp.replace("{{Player}}", player);
            if (cord.x) command = command.replace("{{X}}", cord.x); else command = command.replace("{{X}}", 0);
            if (cord.y) command = command.replace("{{Y}}", cord.y); else command = command.replace("{{Y}}", 128);
            if (cord.y) command = command.replace("{{Z}}", cord.y); else command = command.replace("{{Z}}", 0);
            ServerExec.stdin.write(command+"\n");
            return command;
        }
    }
    ServerExec.on("exit", ()=>{delete global.BdsExecs[returnFuntion.uuid]});
    global.BdsExecs[returnFuntion.uuid] = returnFuntion;
    return returnFuntion;
}

function Player_Json(data = "aaaaaa\n\n\naa", callback = () => {}){
    const Current_platorm = GetPlatform();
    // Bedrock
    if (Current_platorm === "bedrock") {
        // "[INFO] Player connected: Sirherobrine, xuid: 2535413418839840",
        // "[INFO] Player disconnected: Sirherobrine, xuid: 2535413418839840",
        const BedrockMap = data.split(/\n|\r/gi).map(line => {
            if (line.includes("connected") || line.includes("disconnected")) {
                let SplitLine = line.replace(/\[.+\]\s+Player/gi, "").trim().split(/\s+/gi);
                
                // player
                let Player = line.trim().replace(/\[.+\]\s+Player/gi, "").trim().replace(/disconnected:|connected:/, "").trim().split(/,\s+xuid:/).filter(a=>a).map(a=>a.trim()).filter(a=>a);

                //
                let Actions = null;
                if (/^disconnected/.test(SplitLine[0].trim())) Actions = "disconnect";
                else if (/^connected/.test(SplitLine[0].trim())) Actions = "connect";

                // Object Map
                const ObjectReturn = {
                    Player: Player[0],
                    Action: Actions,
                    xuid: Player[1] || null,
                    Date: new Date(),
                }

                // Return
                return ObjectReturn
            } else return false;
        }).filter(a=>a);
        callback(BedrockMap);
    }
    // Java and Pocketmine-MP
    else if (Current_platorm === "java" || Current_platorm === "pocketmine") {
        const JavaMap = data.split(/\n|\r/gi).map(line => {
            if (line.trim().includes("joined the game") || line.includes("left the game")) {
                line = line.replace(/^\[.+\] \[.+\/.+\]:/, "").trim();
                let Actions = null;
                if (/joined/.test(line)) Actions = "connect";
                else if (/left/.test(line)) Actions = "disconnect";
                
                // Player Object
                const JavaObject = {
                    Player: line.replace(/joined the game|left the game/gi, "").trim(),
                    Action: Actions,
                    Date: new Date(),
                }

                // Return JSON
                return JavaObject
            } else return false;
        }).filter(a=>a);
        callback(JavaMap);
    }
    // JSPrismarine
    // else if (Current_platorm === "jsprismarine") console.log("It's still not working");
}

const UpdateUserJSON = function (New_Object = new Array()){
    const Player_Json_path = GetPaths("player");
    const Current_platorm = GetPlatform();
    let Players_Json = {
        bedrock: [],
        java: [],
        pocketmine: [],
        jsprismarine: [],
    }
    if (fs.existsSync(Player_Json_path)) Players_Json = JSON.parse(fs.readFileSync(Player_Json_path, "utf8"));
    
    // Array
    Players_Json[Current_platorm] = Players_Json[Current_platorm].concat(New_Object)

    fs.writeFileSync(Player_Json_path, JSON.stringify(Players_Json, null, 2));
    return Players_Json
}

// Search player in JSON
function Player_Search(player = "dontSteve") {
    const Player_Json_path = GetPaths("player"), Current_platorm = GetPlatform();
    const Players_Json = JSON.parse(fs.readFileSync(Player_Json_path, "utf8"))[Current_platorm]
    for (let Player of Players_Json) {
        if (Player.Player === player.trim()) return Player;
    }
    return {};
}

function GetSessions(){
    const ArraySessions = Object.getOwnPropertyNames(global.BdsExecs)
    if (ArraySessions.length === 0) throw "Start Server";
    if (ArraySessions.length >= 2) throw "Select a session manually:" + ArraySessions.join(", ")
    return global.BdsExecs[0]
}

function BdsCommand(command = "list", SessionID = null) {
    if (!(command)) return false;
    try {
        var Session = {}
        if (!(SessionID)) Session = GetSessions(); else Session = global.BdsExecs[SessionID]
        Session.command(command);
        return true
    } catch (error) {
        return false
    }
}

function stop(SessionID = null) {
    try {
        var Session = {}
        if (!(SessionID)) Session = GetSessions(); else Session = global.BdsExecs[SessionID]
        Session.stop()
        return true
    } catch (error) {
        return false
    }
}

const Cloud_Backup = {
    Azure: require("./clouds/Azure").Uploadbackups,
    Driver: require("./clouds/GoogleDriver").Uploadbackups,
    Oracle: require("./clouds/OracleCI").Uploadbackups,
}
const CurrentBackups = GetCronBackup().map(Crron => {
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

module.exports = {
    start,
    BdsCommand,
    stop,
    CronBackups: CurrentBackups,
    Player_Search,
}
