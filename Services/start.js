function Server_start(){
    const bds = require("../index")
    const Storage = localStorage;
    var exec = require("child_process").exec;
    if (!(bds.detect())){
        if (process.platform == "win32"){
            var serverstated = exec(`bedrock_server.exe`, {
                detached: false,
                cwd: bds.server_dir
            });
        } else if (process.platform == "linux"){
            var serverstated = exec(`chmod 777 bedrock_server && ./bedrock_server`, {
                detached: false,
                env: {
                    PATH: process.env.PATH,
                    LD_LIBRARY_PATH: bds.server_dir
                },
                cwd: bds.server_dir
            });
        };
        var logConsoleStream = require("fs").createWriteStream(bds.log_file, {flags: "a"});
        Storage.setItem("old_log_file", bds.log_file)
        serverstated.stdout.pipe(logConsoleStream);
        if (typeof bds_log_string !== "undefined"){
            delete(bds_log_string)
        }
        serverstated.stdout.on("data", function(data){
            global.bds_log_string += data
        })
        Storage.setItem("bds_status", true);
        global.bds_server_string = serverstated;
        return serverstated;
    } else {
        console.warn(`You already have a server running`)
    }
}

module.exports = {
    Server_start: Server_start
}