module.exports = () => {
    var {execSync} = require("child_process");
    const bds = require("../index")
    var platformKiller, command
    
    if (bds.bds_config.bds_platform === "bedrock") {
        if (process.platform === "win32") platformKiller = "bedrock_server.exe"
        else platformKiller = "bedrock_server"
    }
    else if (bds.bds_config.bds_platform === "java") platformKiller = "MinecraftServerJava.jar"
    else if (bds.bds_config.bds_platform === "pocketmine") platformKiller = "PocketMine-MP.phar"
    else throw Error("Bds Config Platform Error")
    //-------------------------------------------------------------------------------------------------
    if (process.platform === "win32") command = `tasklist /fi "imagename eq ${platformKiller}" | find /i "${platformKiller}" > nul & if not errorlevel 1 (echo 0) else (echo 1)`
    else command = `if (ps aux | grep "${platformKiller}" | grep -v "grep" | grep -q "${platformKiller}";);then echo "0";else echo "1";fi`
    // Command
    let detect_status = execSync(command)
    let JsonReturn = {
        "status": parseInt(detect_status.toString().replaceAll("\n", "")),
        "command": command
    }
    if (process.env.debug === "true") console.log(JsonReturn);
    if (JsonReturn.status === 0) return true;
    else return false
};