module.exports = () => {
    var {execSync} = require("child_process");
    const bds = require("../index")
    var platformDetect, command
    
    if (bds.bds_config.bds_platform === "bedrock") {
        if (process.platform === "win32") platformDetect = "bedrock_server.exe"
        else platformDetect = "bedrock_server"
    }
    else if (bds.bds_config.bds_platform === "java") platformDetect = "MinecraftServerJava.jar"
    else if (bds.bds_config.bds_platform === "pocketmine") platformDetect = "PocketMine-MP.phar"
    else throw Error("Bds Config Platform Error")
    //-------------------------------------------------------------------------------------------------
    if (process.platform === "win32") command = `tasklist /fi "imagename eq ${platformDetect}" | find /i "${platformDetect}" > nul & if not errorlevel 1 (echo 0) else (echo 1)`
    else command = `if (ps aux | grep "${platformDetect}" | grep -v "grep" | grep -q "${platformDetect}";);then echo "0";else echo "1";fi`
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