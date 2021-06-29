const { execSync } = require("child_process");

function getProcess(){
    const MountProcess = [];
    var getList = ""
    if (process.platform === "win32") {
        getList = execSync("tasklist").toString("utf8").split("\r").join("\n").split("\n").filter(d => {return !(d === "" || d.includes("====="))})
        delete getList[0];
        getList = getList.filter(d=>{return (d !== undefined)})
        for (let _line of getList) {
            _line = _line.split(/\s+/)
            // Get argument: wmic process where "ProcessID=4152" get commandline
            const pidNumber = (_line.length - 5)
            MountProcess.push({
                command: (function(){
                    try {
                        return execSync(`wmic process where "ProcessID=${_line[pidNumber]}" get commandline`).toString("utf8").split("\r").join("\n").split("\n").filter(d=>{return !(d.trim() === "" || d.trim() === "CommandLine")}).join(" ").trim().split("\"").join("").trim()
                    } catch (err) {
                        return null
                    }
                })(),
                pid: parseInt(_line[pidNumber]),
                cpu: _line[(_line.length - 3)],
                mem: (_line[(_line.length - 2)].split(".").join("")),
            })
        }
    } else {
        getList = execSync("ps -aux").toString("utf8").split("\n").filter(d=>{return !(/USER\s+/.test(d) || d === "")})
        for (let _line of getList) {
            _line = _line.split(/\s+/)
            MountProcess.push({
                command: (function(){var command = _line[10];const argvLenght = (_line.length - 11);for (let index = 0; index < argvLenght; index++) {command += ` ${_line[11 + index]}`;} return command})(),
                pid: parseInt(_line[1]),
                cpu: _line[2],
                mem: _line[3],
            })
        }
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
        if (/bedrock_server/.test(check.command)) return true;
        if (/PocketMine-MP.phar/.test(check.command)) return true;
        if (/packages\/server\/dist\/Server.js/.test(check.command)) return true;
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
        if (/bedrock_server/.test(check.command)) {
            console.log("Killing Minecraft Bedrock Server");
            killWithPid(check.pid);
        }
        if (/PocketMine-MP.phar/.test(check.command)) {
            console.log("Killing Pocketmine-MP");
            killWithPid(check.pid);
        }
        if (/packages\/server\/dist\/Server.js/.test(check.command)) {
            console.log("Killing JSPrismarine");
            killWithPid(check.pid)
        }
    }
    return true
}

module.exports = {
    getProcess,
    Detect,
    Kill
}