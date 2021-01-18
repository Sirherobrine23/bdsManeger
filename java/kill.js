function bds_kill() {
    var spawn = require("child_process").exec;
    const Storage = localStorage
    if (require("./detect_bds").bds_detect()){

        if (process.platform == "win32") {
            var killbds = spawn(`tasklist /fi "imagename eq server.jar" | find /i "server.jar" > nul & if not errorlevel 1 (taskkill /f /im "server.jar" > nul && exit 0) else (exit 1)`);
        } else if (process.platform == "linux") {
            var killbds = spawn(`kill $(ps aux|grep -v "grep"|grep "server.jar"|awk '{print $2}')`, {shell: true});
        };

        killbds.on("exit", function () {
            killbds.stdin.end();
        });
        Storage.setItem("bds_status", false);
        return true
    } else {
        Storage.setItem("bds_status", false);
        return false
    };
};

module.exports = {
    bds_kill: bds_kill
};