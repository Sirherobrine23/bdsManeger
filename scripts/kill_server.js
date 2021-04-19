module.exports = () => {
    const bds = require("../index")
    var {execSync} = require("child_process");
    if (bds.bds_detect()){
        var ToKill, KillMinecraftPlatform;
        if (bds.platform === "bedrock") {
            if (process.platform === "linux") ToKill = "bedrock_server"
            else if (process.platform === "win32") ToKill = "bedrock_server.exe"
            else throw new Error("Bedrock Platform not supported");
        }
        else if (bds.platform === "java") ToKill = "MinecraftServerJava.jar"
        else if (bds.platform === "pocketmine") ToKill = "PocketMine-MP.phar"
        else throw new Error("Platform Error")
        
        if (process.platform == "win32") KillMinecraftPlatform = `tasklist /fi "imagename eq ${ToKill}" | find /i "${ToKill}" > nul & if not errorlevel 1 (taskkill /f /im "${ToKill}" > nul && exit 0) else (exit 1)`
        else if (process.platform === "linux" || process.platform === "darwin") KillMinecraftPlatform = `kill $(ps aux|grep -v "grep" | grep "${ToKill}" | awk '{print $2}')`

        try {execSync(KillMinecraftPlatform);return true;} catch (error) {console.error(error);return false;}
    } else return false;
};