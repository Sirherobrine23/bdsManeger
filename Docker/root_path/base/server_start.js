const bds = require("/opt/bdsCore/index");
const { existsSync, readFileSync } = require("fs")
const { resolve, join } = require("path")

// Enable APIs
bds.rest();

// Log function
function output(dados){var out = dados; if (out.slice(-1) == "\n") out = out.slice(0, -1); console.log(out)}
// --------------------------------------------------------------------------------------------------------------------

// Bds Maneger Core Token API REST
const bds_tokens = resolve(bds.bds_dir, "bds_tokens.json") 
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
var bds_software
if (existsSync(join(bds.bds_dir_bedrock, "bedrock_server"))) bds_software = true
else if (existsSync(join(bds.bds_dir_bedrock, "bedrock_server.exe"))) bds_software = true
else if (existsSync(join(bds.bds_dir_java, "MinecraftServerJava.jar"))) bds_software = true
else bds_software = false

if (bds_software){
    const server = bds.start()
    server.stdout.on("data", function (data) {output(data)});
    server.on("exit", function(code){
        output(`\n\n\nExit with code ${code}`);
        process.exit(1)
    })
} else throw Error("The server was not installed correctly")