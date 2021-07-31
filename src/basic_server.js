const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolve, join } = require("path");
const { randomUUID } = require("crypto");

// Bds Maneger Inports
const commandExists = require("../lib/commandExist");
const BdsDetect = require("./CheckKill").Detect;
const bds = require("../index");
const { GetServerPaths, GetPaths, GetServerSettings, GetPlatform } = require("../lib/BdsSettings");
const BdsInfo = require("../BdsManegerInfo.json");

// Set bdsexec functions
global.BdsExecs = {};

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

const Player_Json = function (data = "aaaaaa\n\n\naa"){
    const Current_platorm = GetPlatform();
    // Bedrock
    if (Current_platorm === "bedrock") {
        // "[INFO] Player connected: Sirherobrine, xuid: 2535413418839840",
        // "[INFO] Player disconnected: Sirherobrine, xuid: 2535413418839840",
        let BedrockMap = data.split(/\n|\r/gi).map(line => {
            if (line.includes("connected:")) {
                let SplitLine = line.replace(/\[INFO\]\s+Player/, "").trim().split(/\s+/gi);
                
                // player
                let Player = line.trim().replace(/disconnected:|connected:/, "").trim().split(/,\s+xuid:/).filter(a=>a).map(a=>a.trim()).filter(a=>a);

                // Object Map
                const ObjectReturn = {
                    Player: Player[0],
                    Action: `${(()=>{if (SplitLine[0].trim() === "connected:") return "connect"; else if (SplitLine[0].trim() === "disconnected") return "disconect";})()}`,
                    xuid: Player[1] || null,
                    Date: new Date(),
                }

                // Return
                return ObjectReturn;
            } else return false;
        }).filter(a=>a);
        UpdateUserJSON(BedrockMap);
    }

    // Java
    else if (Current_platorm === "java") {
        let JavaMap = data.split(/\n|\r/gi).map(line => {
            if (line.trim().includes("joined the game") || line.includes("left the game")) {
                line = line.replace(/^\[.+\] \[.+\/.+\]: /, "").trim();
                let Actions = null;
                if (/joined/.test(line)) Actions = "connect";
                else if (/left/.test(line)) Actions = "disconect";
                
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
        UpdateUserJSON(JavaMap);
    }
}

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
    ServerExec.stdout.on("data", Player_Json);
    ServerExec.stderr.on("data", Player_Json);
    
    // Log File
    ServerExec.stdout.on("data", LogSaveFunction);
    ServerExec.stderr.on("data", LogSaveFunction);

    // Global and Run
    global.bds_log_string = ""
    ServerExec.stdout.on("data", data => {if (global.bds_log_string) global.bds_log_string = data; else global.bds_log_string += data});

    const returnFuntion = {
        uuid: randomUUID(),
        stop: function (){
            ServerExec.stdin.write(BdsInfo.Servers[GetPlatform()].stop);
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
        on: function(action = String, callback = Function) {}
    }
    ServerExec.on("exit", ()=>{delete global.BdsExecs[returnFuntion.uuid]});
    global.BdsExecs[returnFuntion.uuid] = returnFuntion;
    return returnFuntion;
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

module.exports = {
    start,
    BdsCommand,
    stop
}
