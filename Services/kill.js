function bds_kill() {
    var spawn = require('child_process').exec;
    if (require('../index').detect()){
        if (process.platform == 'win32') {
            var killbds = spawn(`tasklist /fi "imagename eq bedrock_server.exe" | find /i "bedrock_server.exe" > nul & if not errorlevel 1 (taskkill /f /im "bedrock_server.exe" > nul && exit 0) else (exit 1)`);
        } else if (process.platform == 'linux') {
            var killbds = spawn(`kill $(ps aux|grep -v 'grep'|grep 'bedrock_server'|awk '{print $2}')`, {shell: true});
        };
        killbds.on('exit', function () {
            killbds.stdin.end();
        });
        return true
    } else {
        return false
    };
};

module.exports = {
    bds_kill: bds_kill
};