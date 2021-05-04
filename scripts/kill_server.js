const { execSync } = require("child_process");
module.exports = () => {
    var KillMinecraftPlatform;
    var ToKill = [
        "MinecraftServerJava.jar",
        "PocketMine-MP.phar",
        "packages/server/dist/Server.js"
    ];
    if (process.platform === "linux") ToKill.push("bedrock_server")
    else if (process.platform === "win32") ToKill.push("bedrock_server.exe")
    var status = false
    for (let index of ToKill) {
        if (process.platform == "win32") KillMinecraftPlatform = `tasklist /fi "imagename eq ${index}" | find /i "${index}" > nul & if not errorlevel 1 (taskkill /f /im "${index}" > nul && echo 0) else (echo 1)`
        else if (process.platform === "linux" || process.platform === "darwin") KillMinecraftPlatform = `if (ps aux|grep -v "grep" | grep -q "${index}");then (kill $(ps aux|grep -v "grep" | grep "${index}" | awk '{print $2}')) && echo 0 || echo 1; else echo 1;fi`
        let JsonStatus = {
            code: parseInt(execSync(KillMinecraftPlatform).toString().split(/\n/g).join(""))
        }
        if (JsonStatus.code === 0) {console.warn(`${index} Killed`);status = true}
    }
    return status
};