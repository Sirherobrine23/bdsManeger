function Server_start(){
    const bds_detect = require('../index').detect()
    var Storage = require('../index').Storage();
    var exec = require('child_process').exec;
    if (process.platform == 'win32'){
        var bdsDIRpathexe = `bedrock_server.exe`;
    } else if (process.platform == 'linux'){
        var bdsDIRpathexe = `chmod 777 bedrock_server && LD_LIBRARY_PATH=. ./bedrock_server`
    };
    if (!bds_detect){
        var serverstated = exec(bdsDIRpathexe, {
            detached: false,
            cwd: `${require('../index').server_dir}`
        });
        var logConsoleStream = require('fs').createWriteStream(require('../index').log_file, {flags: 'a'});
        serverstated.stdout.pipe(logConsoleStream);
        Storage.setItem('bds_status', true);
        global.bds_server_string = serverstated;
        return serverstated;
    } else {
        console.warn(`You already have a server running`)
    }
}

module.exports = {
    Server_start: Server_start
}