module.exports = () => {
    var spawn = require("child_process").execSync;
    const bds = require("../index")
    var killbds
    if (bds.platform === "bedrock"){
        if (process.platform == "win32") {
            killbds = spawn("tasklist /fi \"imagename eq bedrock_server.exe\" | find /i \"bedrock_server.exe\" > nul & if not errorlevel 1 (echo 0) else (echo 1)");
        } else if (process.platform == "linux") {
            killbds = spawn("ps aux|grep -v \"grep\"|grep \"bedrock_server\"|grep -q \"bedrock_server\";echo $?", {shell: true});
        }
    } else {
        if (process.platform == "win32") {
            killbds = spawn("tasklist /fi \"imagename eq server.jar\" | find /i \"server.jar\" > nul & if not errorlevel 1 (echo 0) else (echo 1)");
        } else if (process.platform == "linux") {
            killbds = spawn("ps aux|grep \"jar server.jar\"|grep -v 'grep'|grep -q \"jar server.jar\";echo $?", {shell: true});
        }
    }
    // 
    console.log(`Detect code ${killbds}`)
    if (killbds == 0){return true} else {return false}
};