module.exports.bds_kill = () => {
    var spawn = require("child_process").exec;
    const Storage = localStorage
    if (require("./detect_bds").bds_detect()){
        if (process.platform == "win32") {
            var killbds = spawn(`tasklist /fi "imagename eq bedrock_server.exe" | find /i "bedrock_server.exe" > nul & if not errorlevel 1 (taskkill /f /im "bedrock_server.exe" > nul && exit 0) else (exit 1)`);
        } else if (process.platform == "linux") {
            var killbds = spawn(`kill $(ps aux|grep -v "grep"|grep "bedrock_server"|awk '{print $2}')`, {shell: true});
        };
        killbds.on("exit", function () {killbds.stdin.end();});
        Storage.setItem("bds_status", false);
        return true
    } else {
        Storage.setItem("bds_status", false);
        return false
    };
}