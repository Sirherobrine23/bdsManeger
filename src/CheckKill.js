const { execSync } = require("child_process");

function getProcess(){
    let MountProcess = [];
    if (process.platform === "win32") {
        MountProcess = execSync("wmic path win32_process get Processid,Commandline,WorkingSetSize", {maxBuffer: Infinity}).toString().split(/\n/gi).filter(a => a.trim()).map(Line => {
            try {
                Line = Line.split(/\r/gi).filter(a => a).join("").trim();
                const line_split = Line.split(/\s+/gi);
                
                // Ignore empty lines
                if (line_split.length <= 2) return false
        
                let pid = line_split[Math.abs(line_split.length - 2)].toString();
                let mem = line_split[Math.abs(line_split.length - 1)].toString();
                let command = Line.slice(0, - Math.abs(pid.length)).trim().slice(0, - Math.abs(mem.length)).trim();
                pid = parseInt(pid);
                mem = parseInt(mem);
                if (command && pid && mem) return {
                    command,
                    pid,
                    mem,
                }; else return false
            } catch (err) {
                console.log(err);
                return false
            }
        }).filter(a => a);
    } else {
        MountProcess = execSync("ps -aux").toString("utf8").split("\n").filter(d=>{return !(/USER\s+/.test(d) || d === "")}).map(_line => _line.split(/\s+/)).map(_line =>{
            return {
                command: (function(){
                    var command = _line[10];
                    const argvLenght = (_line.length - 11);
                    for (let index = 0; index < argvLenght; index++) {
                        command += ` ${_line[11 + index]}`;
                    }
                    return command;
                })(),
                pid: parseInt(_line[1]),
                mem: _line[3],
            }
        })
    }
    return MountProcess;
}

function killWithPid(pid = 1){
    if (process.platform === "win32") return execSync(`taskkill /PID ${pid} /F`).toString("utf8");
    else return execSync(`kill -9 ${pid}`).toString("utf8")
}

function Detect(){
    const CurrentProcess = getProcess();
    for (let check of CurrentProcess) {
        if (/MinecraftServerJava.jar/.test(check.command)) return true;
        if (/spigot.jar/.test(check.command)) return true;
        if (/bedrock_server/.test(check.command)) return true;
        if (/PocketMine-MP.phar/.test(check.command)) return true;
        if (/Dragonfly/.test(check.command)) return true;
    }
    return false
}

function Kill(){
    if (!(Detect())) return false
    const CurrentProcess = getProcess();
    for (let check of CurrentProcess) {
        if (/MinecraftServerJava.jar/.test(check.command)) {
            console.log("Killing Minecraft Server Java");
            killWithPid(check.pid);
        }
        if (/spigot.jar/.test(check.command)) {
            console.log("Killing Spigot");
            killWithPid(check.pid);
        }
        if (/bedrock_server/.test(check.command)) {
            console.log("Killing Minecraft Bedrock Server");
            killWithPid(check.pid);
        }
        if (/PocketMine-MP.phar/.test(check.command)) {
            console.log("Killing Pocketmine-MP");
            killWithPid(check.pid);
        }
        if (/Dragonfly/.test(check.command)) {
            console.log("Killing Dragonfly");
            killWithPid(check.pid);
        }
    }
    return true
}

module.exports = {
    getProcess,
    Detect,
    Kill
}