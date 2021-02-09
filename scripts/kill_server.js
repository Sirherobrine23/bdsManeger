module.exports = () => {
    const bds = require("../index")
    var spawn = require("child_process").exec;
    const Storage = localStorage
    if (bds.bds_detect()){
        var killbds
        if (bds.platform === "bedrock"){
            if (process.platform == "win32") killbds = spawn("tasklist /fi \"imagename eq bedrock_server.exe\" | find /i \"bedrock_server.exe\" > nul & if not errorlevel 1 (taskkill /f /im \"bedrock_server.exe\" > nul && exit 0) else (exit 1)");
            else if (process.platform == "linux") killbds = spawn("kill $(ps aux|grep -v \"grep\"|grep \"bedrock_server\"|awk '{print $2}')", {shell: true});
        } else {
            if (process.platform == "win32") {
                killbds = spawn("tasklist /fi \"imagename eq server.jar\" | find /i \"server.jar\" > nul & if not errorlevel 1 (taskkill /f /im \"server.jar\" > nul && exit 0) else (exit 1)");
            } else if (process.platform == "linux") {
                killbds = spawn("kill $(ps aux|grep -v \"grep\"|grep \"server.jar\"|awk '{print $2}')", {shell: true});
            }
        }
        killbds.on("exit", function () {
            killbds.stdin.end();
        });
        Storage.setItem("bds_status", false);
        return true
    } else {
        Storage.setItem("bds_status", false);
        return false
    }
};