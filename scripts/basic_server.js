const { exec, execSync } = require("child_process");
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
        var Command, Options = {};
        // ---------------------------------------------
        if (GetPlatform() === "bedrock"){
            Options = {
                cwd: GetServerPaths("bedrock")
            }
            if (process.platform == "win32") Command = "bedrock_server.exe";
            else if (process.platform == "linux"){
                execSync("chmod 777 bedrock_server", Options)
                Command = "./bedrock_server";
                if (commandExists("qemu-x86_64-static") && process.arch !== "x64") Command = `qemu-x86_64-static ${Command}`;
                Options.env = {
                    ...process.env,
                    LD_LIBRARY_PATH: Options.cwd
                }

            } else if (process.platform === "darwin") throw Error("Use a imagem Docker")
            else process.exit(210)
        } else if (GetPlatform() === "java") {
            const ramMax = Math.trunc(Math.abs(require("os").freemem() / 1024 / 1024));
            // Check low ram
            if (ramMax <= 512) throw new Error("Low ram memorie");
            const ServerRam = GetServerSettings("java").ram_mb

            if (commandExists("java")) {
                Command = `java -jar -X${ServerRam}M MinecraftServerJava.jar nogui`;
                Options = {
                    cwd: GetServerPaths("java")
                };
            } else {
                var url = bds.package_json.docs_base;
                if (bds.system == "windows") url += "Java-Download#windows"
                else if (bds.system === "linux") url = "Java-Download#linux"
                else if (process.platform === "darwin") url = "Java-Download#macos"
                else url = "Java-Download"
                console.info(`Open: ${url}`)
                if (typeof open === "undefined") require("open")(url); else open(url);
            }
        } else if (GetPlatform() === "pocketmine") {
            Command = `${join(resolve(GetServerPaths("pocketmine"), "bin", "php7", "bin"), "php")} ./PocketMine-MP.phar`
            Options = {cwd: GetServerPaths("pocketmine")};
        } else if (GetPlatform() === "jsprismarine") {
            Command = "node ./packages/server/dist/Server.js";
                Options = {
                    cwd: GetServerPaths("jsprismarine")
                };
        } else throw Error("Bds Config Error")

        // Start Command
        const start_server = exec(Command, Options)
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
