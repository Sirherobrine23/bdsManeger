module.exports.Server_start = () => {
    const bds = require("../index")
    const Storage = localStorage;
    var exec = require("child_process").exec;
    if (!(bds.detect())){
        if (require('command-exists').sync('java')){
            var serverstated = exec(`java -jar server.jar nogui`, {cwd: bds.bds_dir_java});
        } else {
            if (bds.system == 'windows'){require('open')("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows");console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows")}else if (bds.system === 'linux'){require('open')("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux");console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux")} else {require('open')("http://docs.sirherobrine23.com/bds_maneger_api_java");console.log("http://docs.sirherobrine23.com/bds_maneger_api_java")}
        }
        var logConsoleStream = require("fs").createWriteStream(bds.log_file, {flags: "a"});
        Storage.setItem("old_log_file", bds.log_file)
        serverstated.stdout.pipe(logConsoleStream);
        serverstated.stdout.on("data", function(data){
            if (data.includes("agree", "EULA")){
                const path = require('path');
                require('open')("https://account.mojang.com/documents/minecraft_eula");
                require('fs').writeFileSync(path.join(bds.bds_dir_java, "eula.txt"), "eula=true")
                setTimeout(() => {
                    process.exit(0)
                }, 1000);
            }
        })
        if (typeof bds_log_string !== "undefined"){delete(bds_log_string)}
        serverstated.stdout.on("data", function(data){global.bds_log_string += data})
        Storage.setItem("bds_status", true);
        global.bds_server_string = serverstated;
        return serverstated;
    } else {
        console.warn(`You already have a server running`);
        return `You already have a server running`;
    }
}