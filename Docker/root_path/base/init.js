#!/usr/bin/node --no-warnings
const bds = require("/opt/bdsCore/index");
// const bds = require("../../../index");
const { bds_dir, bds_dir_bedrock, bds_dir_java, bds_dir_pocketmine } = bds
const { existsSync, readFileSync } = require("fs")
const { resolve, join } = require("path")

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

bds.download("latest", false, function(status){
    if (status) {
        // Enable APIs
        bds.rest();

        // Log function
        function output(dados){
            dados = dados.split("\n").filter(data => {if (data === "") return false; else return true}).join("\n");
            console.log(dados);
        }
        // --------------------------------------------------------------------------------------------------------------------

        // Bds Maneger Core Token API REST
        const bds_tokens = resolve(bds_dir, "bds_tokens.json") 
        if (existsSync(bds_tokens)) {
            let JSON_ = JSON.parse(readFileSync(bds_tokens, "utf-8"))
            for (let ind in JSON_){
                console.log(`Token: ${JSON_[ind].token}`);
            }
        } else bds.token_register();

        // Telegram bot
        if (process.env.TELEGRAM_TOKEN === "null") console.log("Telegram bot disabled, bot token not informed")
        else if (process.env.TELEGRAM_TOKEN === "undefined") console.log("Telegram bot disabled, bot token not informed")
        else if (process.env.TELEGRAM_TOKEN === "") console.log("Telegram bot disabled, bot token not informed")
        else  bds.telegram.launch()

        // Detect whether the server has been installed
        var bds_software = false
        if (existsSync(join(bds_dir_bedrock, "bedrock_server"))) bds_software = true
        if (existsSync(join(bds_dir_bedrock, "bedrock_server.exe"))) bds_software = true
        if (existsSync(join(bds_dir_java, "MinecraftServerJava.jar"))) bds_software = true
        if (existsSync(join(bds_dir_pocketmine, "MinecraftServerJava.jar"))) bds_software = true

        if (bds_software){
            const server = bds.start()
            server.log(data => output(data));
            server.exit("exit", function(code){
                output(`\n\n\nExit with code ${code}`);
                process.exit(code)
            })
            process.on("exit", function (){
                server.stop()
            })
        } else throw Error("The server was not installed correctly")
    }
});