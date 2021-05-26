#!/usr/bin/node --no-warnings
const { existsSync, readFileSync } = require("fs");
const { join } = require("path");
const { bds_dir, bds_dir_bedrock, bds_dir_java, bds_dir_pocketmine } = require("/opt/bdsCore/bdsgetPaths");
const bds = require("/opt/bdsCore/index");
const readline = require("readline");
const { execSync } = require("child_process");

if (process.env.TELEGRAM_TOKEN === "null") console.warn("Telegram bot disabled, bot token not informed")
else if (process.env.TELEGRAM_TOKEN === "undefined") console.warn("Telegram bot disabled, bot token not informed")
else if (process.env.TELEGRAM_TOKEN === "") console.warn("Telegram bot disabled, bot token not informed")
else  bds.telegram_token_save(process.env.TELEGRAM_TOKEN)

bds.kill()
bds.change_platform(process.env.SERVER)
bds.set_config({
    world: process.env.WORLD_NAME,
    description: process.env.DESCRIPTION,
    gamemode: process.env.GAMEMODE,
    difficulty: process.env.DIFFICULTY,
    players: parseInt(process.env.PLAYERS),
    commands: false,
    account: JSON.parse(process.env.XBOX_ACCOUNT),
    whitelist: false,
    port: 19132,
    portv6: 19133,
    // seed: NewConfig.seed
})

function StartServer(){
    // Enable APIs
    bds.rest();

    console.log(execSync("sudo service nginx start").toString("ascii"));

    // Log function
    function ServerLog(dados){
        dados = dados.split("\n").filter(data => {return (data !== "")}).join("\n").split("\r").filter(data => {return (data !== "")}).join("");
        console.log(dados);
    }
    // --------------------------------------------------------------------------------------------------------------------

    // Bds Maneger Core Token API REST
    const bds_tokens = join(bds_dir, "bds_tokens.json") 
    if (existsSync(bds_tokens)) {
        let JSON_ = JSON.parse(readFileSync(bds_tokens, "utf-8"))
        for (let ind in JSON_){
            console.log(`Token: ${JSON_[ind].token}`);
        }
    } else bds.token_register();

    // Telegram bot
    if (process.env.TELEGRAM_TOKEN === "null" || process.env.TELEGRAM_TOKEN === "undefined" || process.env.TELEGRAM_TOKEN === "") console.log("Telegram bot disabled, bot token not informed");
    else {
        function startBotTeletram(){try {bds.telegram()} catch (error) {console.error(error);startBotTeletram();}}
        startBotTeletram()
    }

    // Detect whether the server has been installed
    try {
        const server = bds.start()
        server.log(function(data){ServerLog(data)});
        server.exit(function(code){
            ServerLog(`\n\n\nExit with code ${code}`);
            process.exit(code)
        })
        if (process.stdin.isTTY) {
            const rl = readline.createInterface({input: process.stdin,output: process.stdout});
            rl.on("line", (input) => {
                if (input === "stop") {rl.close(); server.stop()} else server.command(input)
            });
        }
    } catch (error) {
        bds.download("latest", true)
    }
}
bds.download("latest", false, function(status){
    if (status) StartServer();
    else console.warn("Could not download server")
});