const { execSync } = require("child_process");
module.exports = () => {
    var command;
    const detectFilesExec = [
        "MinecraftServerJava.jar",
        "PocketMine-MP.phar",
        "packages/server/dist/Server.js"
    ];
    if (process.platform === "linux") detectFilesExec.push("bedrock_server");else if (process.platform === "win32") detectFilesExec.push("bedrock_server.exe")

    // Command
    for (let index of detectFilesExec) {
        try {
            if (process.platform === "win32") command = `tasklist /fi "imagename eq ${index}" | find /i "${index}" > nul & if not errorlevel 1 (echo 0) else (echo 1)`
            else command = `if (ps aux | grep "${index}" | grep -v "grep" | grep -q "${index}");then echo "0";else echo "1";fi`
            let detect_status = execSync(command)
            let JsonReturn = {
                "status": parseInt(detect_status.toString().split("\n").join("")),
                "command": command
            }
            if (process.env.debug === "true") console.log(JsonReturn);
            if (JsonReturn.status === 0) return true
        } catch (error) {
            console.log(error);
        }
    }
    return false
};
