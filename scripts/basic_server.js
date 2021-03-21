module.exports.start = () => {
    const bds = require("../index")
    const Storage = localStorage;
    const {exec, execSync} = require("child_process");
    const fs = require("fs")
    const path = require("path")


    if (!(bds.detect())){
        const plat = bds.platform
        var start_server
        if (plat === "bedrock"){
            if (process.platform == "win32"){
                start_server = exec("bedrock_server.exe", {cwd: bds.bds_dir_bedrock});
            } else if (process.platform == "linux"){
                console.log(execSync("chmod 777 bedrock_server", {cwd: bds.bds_dir_bedrock}).toString())
                start_server = exec("./bedrock_server", {env: {PATH: process.env.PATH, LD_LIBRARY_PATH: bds.bds_dir_bedrock}, cwd: bds.bds_dir_bedrock});
            } else {
                process.exit(210)
            }
        } else {
            if (require("command-exists").sync("java")){
                start_server = exec(`java -Xmx${bds.bds_config.java_config.max}M -Xms${bds.bds_config.java_config.max}M -jar server.jar nogui`, {cwd: bds.bds_dir_java});
            } else {
                if (bds.system == "windows"){
                    require("open")("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows");
                    console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows")
                } else if (bds.system === "linux"){
                    require("open")("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux");
                    console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux")
                } else {
                    require("open")("http://docs.sirherobrine23.com/bds_maneger_api_java");
                    console.log("http://docs.sirherobrine23.com/scripts/_java")
                }
            }
        }
        Storage.setItem("old_log_file", bds.log_file)
        start_server.stdout.on("data", function(data){
            if (data.includes("agree", "EULA")){
                const path = require("path");
                require("open")("https://account.mojang.com/documents/minecraft_eula");
                const eula_file = path.join(bds.bds_dir_java, "eula.txt")
                const eula_make_true = fs.readFileSync(eula_file, "utf8").replace("eula=false", "eula=true")
                fs.writeFileSync(eula_file, eula_make_true)
                const node_detect = process.argv[0]
                if (node_detect.includes("node")){
                    console.warn("Ending the process")
                    setTimeout(() => {
                        process.exit(0)
                    }, 1000);
                }
            }
        })
        var logConsoleStream = require("fs").createWriteStream(bds.log_file, {flags: "a"});
        var latestLog = require("fs").createWriteStream(path.join(bds.bds_dir, "log", "latest.log"), {flags: "w"});
        start_server.stdout.pipe(logConsoleStream);
        start_server.stdout.pipe(latestLog);
        start_server.stdout.on("data", function(data){
            data = data.split("\n")
            var username;
            for (let line in data){
                const value = data[line].split(" ")
                // const list_player = value
                const status = value[2]
                if (status === "connected:"){
                    username = value[3]
                    if (username.slice(-1) === ",") username = username.slice(0, -1)
                    console.log("Server Username connected: "+username);
                    const file_users = fs.readFileSync(bds.players_files);
                    const users = JSON.parse(file_users, "utf-8")
                    if (file_users.includes(username)){
                        for (let rem in users){
                            if (users[rem].player === username) {
                                users[rem].connected = true
                                users[rem].date = new Date()
                                users[rem].update.push({
                                    date: new Date(),
                                    connected: true
                                })
                            }
                        }
                    }
                    else users.push({
                        player: username,
                        date: new Date(),
                        connected: true,
                        update: [
                            {
                                date: new Date(),
                                connected: true,
                            }
                        ]
                    })
                    
                    fs.writeFileSync(bds.players_files, JSON.stringify(users, null, 2))
                } else if (status === "disconnected:"){
                    username = value[3]
                    if (username.slice(-1) === ",") username = username.slice(0, -1)
                    console.log("Server Username disconnected: "+username);
                    const users = JSON.parse(fs.readFileSync(bds.players_files, "utf-8"))
                    for (let rem in users){
                        if (users[rem].player === username) {
                            users[rem].connected = false
                            users[rem].date = new Date()
                            users[rem].update.push({
                                date: new Date(),
                                connected: false
                            })
                        }
                    }
                    fs.writeFileSync(bds.players_files, JSON.stringify(users, null, 2))
                }
            }
        })
        if (typeof bds_log_string !== "undefined"){bds_log_string = ""}
        start_server.stdout.on("data", function(data){if (global.bds_log_string === undefined) global.bds_log_string = data;else global.bds_log_string += data})
        Storage.setItem("bds_status", true);
        global.bds_server_string = start_server;
        return start_server;
    } else {
        console.warn("You already have a server running");
        return "You already have a server running";
    }
}
module.exports.stop = () => {
    if (typeof bds_server_string == "undefined"){
        const detect = process.argv[0];
        if (detect === "electron") alert("The server is stopped!");
        else console.log("The server is stopped!");
    } else {
        bds_server_string.stdin.write("stop\n");
        bds_server_string.stdout.on("data", function (data){
            if (data.includes("Quit correctly")){
                localStorage.setItem("bds_status", false)
            }
        });
    }
    return
}
