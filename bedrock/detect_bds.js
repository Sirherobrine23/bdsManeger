const { storage } = require("googleapis/build/src/apis/storage");

module.exports.bds_detect = () => {
    var spawn = require("child_process").execSync;
    if (localStorage.getItem("bds_edititon") === 'java'){
        if (process.platform == "win32") {
            var killbds = spawn(`tasklist /fi "imagename eq server.jar" | find /i "server.jar" > nul & if not errorlevel 1 (echo 0) else (echo 1)`);
        } else if (process.platform == "linux") {
            var killbds = spawn(`ps aux|grep "jar server.jar"|grep -v 'grep'|grep -q "jar server.jar";echo $?`, {shell: true});
        };
    } else {
        if (process.platform == "win32") {
            var killbds = spawn(`tasklist /fi "imagename eq bedrock_server.exe" | find /i "bedrock_server.exe" > nul & if not errorlevel 1 (echo 0) else (echo 1)`);
        } else if (process.platform == "linux") {
            var killbds = spawn(`ps aux|grep -v "grep"|grep "bedrock_server"|grep -q "bedrock_server";echo $?`, {shell: true});
        };
    }
    
    if (killbds == 0){
        return true
    } else {
        return false
    };
};