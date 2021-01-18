module.exports.Server_start = () => {
    const bds = require("../index")
    const Storage = localStorage;
    var exec = require("child_process").exec;
    const mine = localStorage.getItem('bds_edititon')
    if (!(bds.detect())){
        if (process.platform == "win32"){
            var serverstated = exec(`bedrock_server.exe`, {cwd: bds.bds_dir_bedrock});
        } else if (process.platform == "linux"){
            var serverstated = exec(`chmod 777 bedrock_server && ./bedrock_server`, {env: {PATH: process.env.PATH, LD_LIBRARY_PATH: bds.bds_dir_bedrock}, cwd: bds.bds_dir_bedrock});
        };
        var logConsoleStream = require("fs").createWriteStream(bds.log_file, {flags: "a"});
        Storage.setItem("old_log_file", bds.log_file)
        serverstated.stdout.pipe(logConsoleStream);
        if (typeof bds_log_string !== "undefined"){delete(bds_log_string)}
        serverstated.stdout.on("data", function(data){global.bds_log_string += data})
        Storage.setItem("bds_status", true);
        global.bds_server_string = serverstated;
        return serverstated;
    } else {
        console.warn(`You already have a server running`)
        return `You already have a server running`
    }
}