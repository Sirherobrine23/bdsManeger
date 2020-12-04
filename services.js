function Server_Start() {
    var today = require('bds_maneger_api').date('full')
    var fs = require('fs')
    let logConsoleStream = fs.createWriteStream(`${home}/Desktop/${today}_Bds_log.log`, {flags: 'a'});
    var exec = require('child_process').exec;
    if (process.platform == 'win32'){
        var bdsDIRpathexe = `cd ${process.env.USERPROFILE}/bds_Server/ && bedrock_server.exe`;
    } else if (process.platform == 'linux'){
        var bdsDIRpathexe = `cd ${process.env.HOME}/bds_Server/ && chmod 777 bedrock_server && LD_LIBRARY_PATH=${process.env.HOME}/bds_Server/.  ./bedrock_server`
    }
    var serverstated = exec(bdsDIRpathexe, {detached: false});
    serverstated.stdout.pipe(logConsoleStream);
    return serverstated    
};
function Server_Stop(VAR){
    require('./').command(VAR,`say Vai para ao chegar no 10`)
    for (let index = 1; index < 12; index++) {
        setTimeout(function timer() {
            if (index == '11'){
                require('./').command(VAR, `stop`)
            } else {
                require('./').command(VAR, `say Server is stop in ${index}s`)
                console.log(`Server is stop in ${index}s`);
            };
        }, index * 1000);
    };
};