const { exec, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolve } = require("path");
const commandExists = require("../commandExist");
const saveUser = require("./SaveUserInJson");
const bds = require("../index");
const { bds_dir_bedrock, bds_dir_java, bds_dir_pocketmine, bds_dir_jsprismarine ,log_dir } = require("../bdsgetPaths");
const BdsDetect = require("./detect")

function start() {
    if (BdsDetect()){
        console.warn("You already have a server running");
        return "You already have a server running";
    } else {
        var Command, Options = {};
        // ---------------------------------------------
        if (bds.platform === "bedrock"){
            if (process.platform == "win32") {
                Command = "bedrock_server.exe"
                Options = {
                    cwd: bds_dir_bedrock
                }
            }
            else if (process.platform == "linux"){
                execSync("chmod 777 bedrock_server", {cwd: bds_dir_bedrock}).toString();
                Command = "./bedrock_server";
                if (process.platform === "linux" && bds.require_qemu) {if (commandExists("qemu-x86_64-static")) Command = `qemu-x86_64-static ${Command}`}
                Options = {
                    env: {
                        ...process.env,
                        LD_LIBRARY_PATH: bds_dir_bedrock
                    },
                    cwd: bds_dir_bedrock
                }

            } else if (process.platform === "darwin") throw Error("We don't have MacOS support yet")
            else process.exit(210)
        } else if (bds.platform === "java") {
            var ram_max = Math.trunc(Math.abs((require("os").freemem() / 1024 / 1024) / 1.5))
            var ram_minimun = ram_max;
            // Check low ram
            if (ram_max <= 300) throw new Error("Low ram memorie")	;

            if (ram_max >= 1000) ram_max = Math.trunc(ram_max / 2);
            if (commandExists("java")) {
                Command = `java -Xmx${ram_max}M -Xms${ram_minimun || ram_max}M -jar MinecraftServerJava.jar nogui`;
                Options = {
                    cwd: bds_dir_java
                };
            }
            else {
                var url = bds.package_json.docs_base;
                if (bds.system == "windows") url += "Java-Download#windows"
                else if (bds.system === "linux") url = "Java-Download#linux"
                else if (process.platform === "darwin") url = "Java-Download#macos"
                else url = "Java-Download"
                console.info(`Open: ${url}`)
                if (typeof open === "undefined") require("open")(url); else open(url);
            }
        } else if (bds.platform === "pocketmine") {
            const phpinCore = resolve(bds_dir_pocketmine, "bin", "php7", "bin")
            if (commandExists("php")) throw Error("php command installed in system, please remove php from your system as it may conflict with pocketmine");
            else if (!fs.existsSync(phpinCore)) throw Error("Reinstall Pocketmine-MP, PHP binaries folder not found");
                Command = "php ./PocketMine-MP.phar";
                const currentEnv = process.env
                if (process.platform === "win32") currentEnv.PATH += `;${phpinCore}`;else currentEnv.PATH += `:${phpinCore}`;
                Options = {
                    env: currentEnv,
                    cwd: bds_dir_pocketmine
                };
        } else if (bds.platform === "jsprismarine") {
            Command = "node --warning --circular ./packages/server/dist/Server.js";
                Options = {
                    cwd: bds_dir_jsprismarine
                };
        } else throw Error("Bds Config Error")

        // Start Command
        const start_server = exec(Command, Options)
        // Post Start
        if (bds.platform === "java") {
            start_server.stdout.on("data", function(data){
                if (data.includes("agree"))
                    if (data.includes("EULA")){
                        const eula_file = path.join(bds_dir_java, "eula.txt");
                        fs.writeFileSync(eula_file, fs.readFileSync(eula_file, "utf8").split("eula=false").join("eula=true"));
                        throw new Error("Restart application/CLI")
                    }
            });
        }

        if (typeof global.bdsexecs === "undefined") global.bdsexecs = [{exec: start_server, name: Math.random()}]; else global.bdsexecs.push({exec: start_server, name: Math.random()})

        // save User in Json
        start_server.stdout.on("data", data => saveUser(data))
        start_server.stderr.on("data", data => saveUser(data))

        // Clear latest.log
        fs.writeFileSync(path.join(log_dir, "latest.log"), "")

        // stdout
        start_server.stdout.pipe(fs.createWriteStream(bds.log_file, {flags: "a"}));
        start_server.stdout.pipe(fs.createWriteStream(path.join(log_dir, "latest.log"), {flags: "a"}));

        // stderr
        start_server.stderr.pipe(fs.createWriteStream(bds.log_file, {flags: "a"}));
        start_server.stderr.pipe(fs.createWriteStream(path.join(log_dir, "latest.log"), {flags: "a"}));

        // Global and Run
        global.bds_log_string = ""
        start_server.stdout.on("data", function(data){
            if (global.bds_log_string === undefined || global.bds_log_string === "") global.bds_log_string = data; else global.bds_log_string += data
        });
        global.bds_server_string = start_server;

        const returnFuntion = {};
        returnFuntion["exec"] = start_server;
        returnFuntion["stop"] = function (){start_server.stdin.write("stop\n")};
        returnFuntion["command"] = function (command, callback){
            const oldLog = global.bds_log_string;
            start_server.stdin.write(`${command}\n`);
            if (typeof callback === "function") {
                setTimeout(() => {
                    // Run commands from command run in server;
                    callback(global.bds_log_string.replace(oldLog, "").split(/\r/).filter(data => {if (data === "") return false; else return true;}).join("\n"))
                }, 1000);
            }
        }
        returnFuntion["stdout"] = start_server.stdout.on;
        returnFuntion["stderr"] = start_server.stderr.on;
        returnFuntion["on"] = start_server.on;
        
        returnFuntion["log"] = function (callback){start_server.stdout.on("data", data => callback(data)); start_server.stderr.on("data", data => callback(data));}
        returnFuntion["exit"] = function (callback){start_server.on("exit", code => callback(code))}
        
        return returnFuntion
    }
}

function BdsCommand(command) {
    if (typeof bds_server_string === "undefined") return false;
    else {
        if (command === undefined) return false;
        else if (command === "") return false;
        else bds_server_string.stdin.write(`${command}\n`);
        return true
    }
}

function stop() {
    if (typeof bds_server_string == "undefined") return false;
    else bds_server_string.stdin.write("stop\n");
    return true
}

module.exports = {
    start,
    BdsCommand,
    stop
}