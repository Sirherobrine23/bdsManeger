const bds = require("../index");
const {exec, execSync} = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolve } = require("path");
const commandExists = require("command-exists").sync;

module.exports.start = () => {
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
                start_server.stdout.on("data", data => require("./SaveUserInJson").bedrock(data))
            } else if (process.platform === "darwin") throw Error("We don't have MacOS support yet")
            else process.exit(210)
        } else if (plat === "java") {
            var ram_max = Math.trunc((require("os").freemem() / 1000 / 1000) - 212)
            var ram_minimun = ram_max;
            if (ram_max >= 1000) {ram_max = Math.trunc(ram_max / 10);ram_minimun = Math.trunc(ram_max / 50)}
            if (require("command-exists").sync("java")) start_server = exec(`java -Xmx${ram_max}M -Xms${ram_minimun}M -jar MinecraftServerJava.jar nogui`, {cwd: bds.bds_dir_java});
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
            start_server.stdout.on("data", data => require("./SaveUserInJson").java(data))
        } else if (plat === "pocketmine") {
            const phpinCore = resolve(bds.bds_dir_pocketmine, "bin", "php7", "bin")
            if (commandExists("php")) throw Error("php command installed in system, please remove php from your system as it may conflict with pocketmine");
            else if (fs.existsSync(phpinCore)) 
                if (!(process.env.PATH.includes(phpinCore))) 
                    if (process.platform === "win32") process.env.PATH += `;${phpinCore}`; else process.env.PATH += `:${phpinCore}`;
            else throw Error("Reinstall Pocketmine-MP, PHP binaries not found")
            start_server = exec("php ./PocketMine-MP.phar", {env: process.env, cwd: bds.bds_dir_pocketmine});
            start_server.stdout.on("data", data => require("./SaveUserInJson").pocketmine(data))
        } else throw Error("Bds Config Error")
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
        start_server.stdout.pipe(fs.createWriteStream(bds.log_file, {flags: "a"}));
        start_server.stdout.pipe(fs.createWriteStream(path.join(bds.bds_dir, "log", "latest.log"), {flags: "w"}));
        if (typeof bds_log_string !== "undefined"){bds_log_string = ""}
        start_server.stdout.on("data", function(data){if (global.bds_log_string === undefined) global.bds_log_string = data;else global.bds_log_string += data});
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
