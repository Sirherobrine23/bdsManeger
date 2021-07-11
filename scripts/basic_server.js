const { exec, execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolve, join } = require("path");
const commandExists = require("../lib/commandExist");
const saveUser = require("./PlayersSave");
const bds = require("../index");
const { GetServerPaths, GetPaths, GetServerSettings, GetPlatform } = require("../lib/BdsSettings");
const BdsDetect = require("./CheckKill").Detect;
const { randomUUID } = require("crypto");
const { warn } = console;

// Set bdsexec functions
global.BdsExecs = {};

function saveLog(data = "", LogFile = ""){
    fs.appendFileSync(path.join(GetPaths("log"), "latest.log"), data)
    fs.appendFileSync(LogFile, data)
}
function start() {
    if (BdsDetect()){
        console.warn("You already have a server running");
        throw "You already have a server running";
    } else {
        var start_server;

        // Minecraft Bedrock Oficial
        if (GetPlatform() === "bedrock"){
            if (process.platform === "darwin") throw Error("Use a imagem Docker");
            else if (process.platform == "win32") start_server = exec("bedrock_server.exe", {
                cwd: GetServerPaths("bedrock"),
            });
            else if (process.platform == "linux"){
                // Set Executable file
                execFile("chmod 777 bedrock_server", {cwd: GetServerPaths("bedrock")});
                var BedrockCommand = "./bedrock_server";

                // Emulation of the x86_64 architecture
                if (commandExists("qemu-x86_64-static") && process.arch !== "x64") BedrockCommand = "qemu-x86_64-static "+BedrockCommand;

                // Start Bedrock Server 
                start_server = exec(BedrockCommand, {cwd: GetServerPaths("bedrock"), env: {...process.env, LD_LIBRARY_PATH: GetServerPaths("bedrock")}})
            } else throw new Error("your system does not support Minecraft Bedrock (yet)")
        }

        // Minecraft Java Oficial
        else if (GetPlatform() === "java") {
            const JavaConfig = GetServerSettings("java")

            // Checking if java is installed on the device
            if (commandExists("java")) {
                start_server = execFile("java", [
                    "-jar",
                    `-Xms${JavaConfig.ram_mb}M`,
                    `-Xmx${JavaConfig.ram_mb}M`,
                    "MinecraftServerJava.jar",
                    "nogui"
                ], {cwd: GetServerPaths("java")})
            } else {
                var url = bds.package_json.docs_base; if (bds.system == "windows") url += "Java-Download#windows"; else if (bds.system === "linux") url = "Java-Download#linux"; else if (process.platform === "darwin") url = "Java-Download#macos"; else url = "Java-Download";
                require("open")(url);
                throw new Error(`Open: ${url}`)
            }
        } else if (GetPlatform() === "pocketmine") {
            // Start PocketMine-MP
            const php_bin_path = join(resolve(GetServerPaths("pocketmine"), "bin", "php7", "bin"), "php");
            start_server = execFile(php_bin_path, [
                "./PocketMine-MP.phar"
            ], {
                cwd: GetServerPaths("pocketmine")
            })
        } else if (GetPlatform() === "jsprismarine") {
            // Start JSPrismarine
            start_server = execFile("node", [
                "./packages/server/dist/Server.js"
            ], {
                cwd: GetServerPaths("jsprismarine")
            });
        } else throw Error("Bds Config Error")

        // Post Start
        if (GetPlatform() === "java") {
            start_server.stdout.on("data", function(data){
                if (data.includes("agree"))
                    if (data.includes("EULA")){
                        const eula_file = path.join(GetServerPaths("java"), "eula.txt");
                        fs.writeFileSync(eula_file, fs.readFileSync(eula_file, "utf8").split("eula=false").join("eula=true"));
                        throw new Error("Restart application/CLI")
                    }
            });
        }
        
        // Log file
        const LogFile = join(GetPaths("log"), `${bds.date()}_${GetPlatform()}_Bds_log.log`);
        // save User in Json
        start_server.stdout.on("data", data => saveUser(data))
        start_server.stderr.on("data", data => saveUser(data))
        // ---------------------------------------------------
        // Clear latest.log
        fs.writeFileSync(path.join(GetPaths("log"), "latest.log"), "")
        
        // ---------------------------------------------------
        // stdout
        start_server.stdout.on("data", a=>saveLog(a, LogFile));
        start_server.stderr.on("data", a=>saveLog(a, LogFile));
        // ---------------------------------------------------
        // Global and Run
        global.bds_log_string = ""
        start_server.stdout.on("data", function(data){
            if (global.bds_log_string === undefined || global.bds_log_string === "") global.bds_log_string = data; else global.bds_log_string += data
        });
        global.bds_server_string = start_server;

        // Functions return
        const returnFuntion = {
            uuid: randomUUID(),
            exec: start_server,
            stop: function (){start_server.stdin.write("stop\n")},
            command: function (command = "list", callback){
                const oldLog = global.bds_log_string;
                start_server.stdin.write(`${command}\n`);
                if (typeof callback === "function") {
                    setTimeout(() => {
                        // Run commands from command run in server;
                        const log = global.bds_log_string.replace(oldLog, "").split(/\r/).filter(data => {if (data === "") return false; else return true;}).join("\n") 
                        if (log.length >= 1) callback(log); else callback("no log")
                    }, 1555);
                }
            },
            log: function (logCallback = function(data = ""){data.split("\n").filter(d=>{return (d !== "")}).forEach(l=>console.log(l))}){
                if (typeof logCallback !== "function") {
                    warn("The log callback is not a function using console.log");
                    logCallback = function(data = ""){data.split("\n").filter(d=>{return (d !== "")}).forEach(l=>console.log(l))}
                }
                start_server.stdout.on("data", data => logCallback(data));
                start_server.stderr.on("data", data => logCallback(data));
            },
            exit: function (exitCallback = process.exit){if (
                typeof exitCallback === "function") start_server.on("exit", code => exitCallback(code));
            }
        }
        start_server.on("exit", ()=>{delete global.BdsExecs[returnFuntion.uuid]})
        global.BdsExecs[returnFuntion.uuid] = returnFuntion
        return returnFuntion
    }
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
