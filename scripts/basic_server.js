const bds = require("../index")
const Storage = localStorage;
const {exec, execSync} = require("child_process");
const fs = require("fs")
const path = require("path")
const {CheckBan} = require("./check");
const { resolve } = require("path");
const commandExists = require("command-exists").sync

module.exports.start = () => {
    function KickPlayer(player){
        console.warn(`Player ${player} tried to connect to the server`)
        let removeUser = `kick "${player}" Player banned: ${player}`
        console.log(removeUser);
        var stared_ban = setInterval(() => {
            bds.command(removeUser)
            const detect_exit = bds_log_string.split("\n")
            for (let index in detect_exit) {
                const element = detect_exit[index];
                // Player disconnected: Steve alex,
                if (element.includes("Player disconnected:")) {
                    if (element.includes(removeUser)) {
                        clearInterval(stared_ban)
                        clearInterval(stared_ban)
                        clearInterval(stared_ban)
                        clearInterval(stared_ban)
                        clearInterval(stared_ban)
                    }
                }
            }
        }, 5 * 1000);
    }
    if (!(bds.detect())){
        const plat = bds.platform
        var start_server
        if (plat === "bedrock"){
            if (process.platform == "win32") start_server = exec("bedrock_server.exe", {cwd: bds.bds_dir_bedrock});
            else if (process.platform == "linux"){
                execSync("chmod 777 bedrock_server", {cwd: bds.bds_dir_bedrock}).toString();
                start_server = exec("./bedrock_server", {env: {
                    ...process.env,
                    LD_LIBRARY_PATH: bds.bds_dir_bedrock
                }, cwd: bds.bds_dir_bedrock});
                start_server.stdout.on("data", function(data){
                    data = data.split("\n")
                    var username;
                    for (let line in data){
                        const value = data[line].split(" ")
                        // const list_player = value
                        const status = value[2]
                        if (status === "connected:"){
                            if (value[3].includes(",")) username = value[3]
                            else username = `${value[3]} ${value[4]}`
                            if (username.slice(-1) === ",") username = username.slice(0, -1)
                            //------------------
                            if (CheckBan(username)) KickPlayer(username)
                            else {
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
                                } else users.push({
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
                            }
                            
                        } else if (status === "disconnected:"){
                            if (value[3].includes(",")) username = value[3]
                            else username = `${value[3]} ${value[4]}`
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
            } else if (process.platform === "darwin") throw Error("We don't have MacOS support yet")
            else process.exit(210)
        } else if (plat === "java") {
            var ram_max = Math.trunc((require("os").freemem() / 1000 / 1000) - 212)
            var ram_minimun = ram_max;
            if (ram_max >= 1000) {ram_max = Math.trunc(ram_max / 10);ram_minimun = Math.trunc(ram_max / 50)}
            if (require("command-exists").sync("java")) start_server = exec(`java -Xmx${ram_max}M -Xms${ram_minimun}M -jar server.jar nogui`, {cwd: bds.bds_dir_java});
            else {
                if (bds.system == "windows"){
                    require("open")("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows");
                    console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Windows")
                } else if (bds.system === "linux"){
                    require("open")("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux");
                    console.log("http://docs.sirherobrine23.com/bds_maneger_api_java#Linux")
                } else {
                    require("open")("http://docs.sirherobrine23.com/bds_maneger_api_java#MacOS");
                    console.log("http://docs.sirherobrine23.com/scripts/_java")
                }
            }
        } else if (plat === "pocketmine") {
            let childPorcessEnv = process.env
            const phpinCore = resolve(bds.bds_dir_pocketmine, "bin", "php7", "bin")
            if (commandExists("php")) throw Error("php command installed in system, please remove php from your system as it may conflict with pocketmine");
            else if (fs.existsSync(phpinCore)) {
                console.log(phpinCore);
                if (process.env.PATH.includes(phpinCore))console.log("PHP bin folder includes in PATH"); 
                else {
                    if (process.platform === "win32") childPorcessEnv.PATH += `;${phpinCore}`
                    else childPorcessEnv.PATH += `:${phpinCore}`
                }
            }
            else throw Error("Reinstall Pocketmine-MP, PHP binaries not found")
            console.log(childPorcessEnv.PATH);
            start_server = exec("php ./PocketMine-MP.phar", {env: {
                ...childPorcessEnv
            }, cwd: bds.bds_dir_pocketmine});
        } else throw Error("")
        Storage.setItem("old_log_file", bds.log_file)
        start_server.stdout.on("data", function(data){
            if (data.includes("agree", "EULA")){
                const path = require("path");
                require("open")("https://account.mojang.com/documents/minecraft_eula");
                const eula_file = path.join(bds.bds_dir_java, "eula.txt")
                fs.writeFileSync(eula_file, fs.readFileSync(eula_file, "utf8").replace("eula=false", "eula=true")) 
                if (process.argv[0].includes("node")){
                    console.warn("Ending the process")
                    setTimeout(() => {
                        process.exit(0)
                    }, 1000);
                }
            }
        });
        start_server.stdout.pipe(fs.createWriteStream(bds.log_file, {flags: "a"}));
        start_server.stdout.pipe(fs.createWriteStream(path.join(bds.bds_dir, "log", "latest.log"), {flags: "w"}));
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

module.exports.BdsCommand = function (command) {
    if (typeof bds_server_string === "undefined") return false;
    else {
        if (command === undefined) return false;
        else if (command === "") return false;
        else bds_server_string.stdin.write(`${command}\n`);
        return true
    }
};

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
