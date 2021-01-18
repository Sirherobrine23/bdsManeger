module.exports.bds_detect = () => {
    var spawn = require("child_process").execSync;
    if (process.platform == "win32") {
        var killbds = spawn(`tasklist /fi "imagename eq server.jar" | find /i "server.jar" > nul & if not errorlevel 1 (echo 0) else (echo 1)`);
    } else if (process.platform == "linux") {
        var killbds = spawn(`ps aux|grep "jar server.jar"|grep -v 'grep'|grep -q "jar server.jar";echo $?`, {shell: true});
    }
    // 
    if (killbds == 0){return true} else {return false};
};