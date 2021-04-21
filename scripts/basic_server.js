const bds = require("../index");
const {exec, execSync} = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolve } = require("path");
const commandExists = require("command-exists").sync;
const saveUser = require("./SaveUserInJson")

module.exports.start = () => {
    if (!(bds.detect())){
        const plat = bds.platform
        var Command, Options = {};

        if (plat === "bedrock"){
            if (process.platform == "win32") {
                Command = "bedrock_server.exe"
                Options = {
                    cwd: bds.bds_dir_bedrock
                }
            }
            else if (process.platform == "linux"){
                execSync("chmod 777 bedrock_server", {cwd: bds.bds_dir_bedrock}).toString();
                Command = "./bedrock_server";
                Options = {
                    env: {
                        ...process.env,
                        LD_LIBRARY_PATH: bds.bds_dir_bedrock
                    },
                    cwd: bds.bds_dir_bedrock
                }

            } else if (process.platform === "darwin") throw Error("We don't have MacOS support yet")
            else process.exit(210)
        } else if (plat === "java") {
            var ram_max = Math.trunc((require("os").freemem() / 1000 / 1000) - 212)
            var ram_minimun = ram_max;
            if (ram_max >= 1000) {ram_max = Math.trunc(ram_max / 10);ram_minimun = Math.trunc(ram_max / 50)}
            if (require("command-exists").sync("java")) {
                Command = `java -Xmx${ram_max}M -Xms${ram_minimun}M -jar MinecraftServerJava.jar nogui`;
                Options = {
                    cwd: bds.bds_dir_java
                };
            }
            else {
                var url = bds.package_json.docs_base;
                if (bds.system == "windows") url += "Java-Download#windows"
                else if (bds.system === "linux") url = "Java-Download#linux"
                else if (process.platform === "darwin") url = "Java-Download#macos"
                else url = "Java-Download"
                console.info(`Open: ${url}`)
                if (typeof open === "undefined") require("open")(url); else open(url);
            }
        } else if (plat === "pocketmine") {
            const phpinCore = resolve(bds.bds_dir_pocketmine, "bin", "php7", "bin")
            if (commandExists("php")) throw Error("php command installed in system, please remove php from your system as it may conflict with pocketmine");
            else if (fs.existsSync(phpinCore)) {
                if (!(process.env.PATH.includes(phpinCore))) {
                    if (process.platform === "win32") process.env.PATH += `;${phpinCore}`;
                    else process.env.PATH += `:${phpinCore}`;
                }
            }
            else throw Error("Reinstall Pocketmine-MP, PHP binaries folder not found")
                Command = "php ./PocketMine-MP.phar";
                Options = {
                    env: process.env,
                    cwd: bds.bds_dir_pocketmine
                };
        } else throw Error("Bds Config Error")
        
        // Start Command
        const start_server = exec(Command, Options)
        // Post Start
        start_server.stdout.on("data", function(data){
            if (data.includes("agree"))
                if (data.includes("EULA")){
                    const path = require("path");
                    require("open")("https://account.mojang.com/documents/minecraft_eula");
                    const eula_file = path.join(bds.bds_dir_java, "eula.txt")
                    fs.writeFileSync(eula_file, fs.readFileSync(eula_file, "utf8").replace("eula=false", "eula=true")) 
                    if (process.argv[0].includes("node")){
                        console.warn("Ending the process")
                        process.exit(0)
                    }
                }
        });
        start_server.stdout.on("data", data => saveUser(data))
        start_server.stdout.pipe(fs.createWriteStream(bds.log_file, {flags: "a"}));
        start_server.stdout.pipe(fs.createWriteStream(path.join(bds.bds_dir, "log", "latest.log"), {flags: "w"}));
        if (typeof bds_log_string !== "undefined"){global.bds_log_string = ""}
        start_server.stdout.on("data", function(data){
            if (global.bds_log_string === undefined)
                global.bds_log_string = data;
            else
                global.bds_log_string += data
        });
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
    if (typeof bds_server_string == "undefined") return false;
    else bds_server_string.stdin.write("stop\n");
    return true
}
