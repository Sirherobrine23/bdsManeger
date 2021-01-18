function Server_start(){
    const bds = require("../index")
    const Storage = localStorage;
    var exec = require("child_process").exec;
    const mine = localStorage.getItem('bds_edititon')
    if (!(bds.detect())){
        if (mine === "java"){
            if (require('command-exists').sync('java')){
                var serverstated = exec(`java -jar server.jar nogui`, {cwd: bds.bds_dir_java});
            } else {
                if (bds.system == 'windows'){
                    require('open')("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows")
                    console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows")
                }else if (bds.system === 'linux'){
                    require('open')("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux")
                    console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux")
                } else {
                    require('open')("http://docs.sirherobrine23.com/bds_maneger_api_java")
                    console.log("http://docs.sirherobrine23.com/bds_maneger_api_java")
                }
            }
        } else {
            if (process.platform == "win32"){
                var serverstated = exec(`bedrock_server.exe`, {cwd: bds.bds_dir_bedrock});
            } else if (process.platform == "linux"){
                var serverstated = exec(`chmod 777 bedrock_server && ./bedrock_server`, {env: {PATH: process.env.PATH, LD_LIBRARY_PATH: bds.bds_dir_bedrock}, cwd: bds.bds_dir_bedrock});
            };
        }
        var logConsoleStream = require("fs").createWriteStream(bds.log_file, {flags: "a"});
        Storage.setItem("old_log_file", bds.log_file)
        serverstated.stdout.pipe(logConsoleStream);
        serverstated.stdout.on("data", function(data){
            if (data.includes("agree", "EULA")){
                const path = require('path');
                require('open')("https://account.mojang.com/documents/minecraft_eula")
                if (mine == "java"){
                    require('fs').writeFileSync(path.join(bds.bds_dir_java, "eula.txt"), "eula=true")
                } else {
                    require('fs').writeFileSync(path.join(bds.bds_dir_bedrock, "eula.txt"), "eula=true")
                }
            }
        })
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