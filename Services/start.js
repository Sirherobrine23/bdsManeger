// start server (Inject in iframe)
// Very important file to start the server in NodeJs and leave it in the background.
if (require('../index').electron){
    function LogOut(data){
        
    }
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
serverstated.stdout.on('data', function (data) {
    LogOut(data)
});