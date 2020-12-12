function Server_start(){
    if (require('bds_maneger_api').electron){
        function LogOut(data){
            if (document.getElementById('LOG').tagName == 'TEXTAREA'){
                document.getElementById('LOG').value = data
            } else {
                document.getElementById('LOG').innerHTML = data
            };
        };
    } else {
        function LogOut(data){
            console.log(data)
        }
    }
    var exec = require('child_process').exec;
    if (process.platform == 'win32'){
        var bdsDIRpathexe = `bedrock_server.exe`;
    } else if (process.platform == 'linux'){
        var bdsDIRpathexe = `chmod 777 bedrock_server && LD_LIBRARY_PATH=. ./bedrock_server`
    }
    var serverstated = exec(bdsDIRpathexe, {
        detached: false,
        cwd: `${require('bds_maneger_api').server_dir}`
    });
    // serverstated.stdout.on('data', function (data) {
    //     LogOut(data)
    // });
    var logConsoleStream = require('fs').createWriteStream(require('bds_maneger_api').log_file, {flags: 'a'});
    serverstated.stdout.pipe(logConsoleStream);
    return serverstated
}

module.exports = {
    Server_start: Server_start
}