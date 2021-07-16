const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const bds = require("../index");
const { GetPlatform, GetPaths } = require("../lib/BdsSettings");
const { GetKernel, arch, system } = require("../lib/BdsSystemInfo");
const { Detect } = require("../scripts/CheckKill");
const TelegramOptions = require("minimist")(process.argv.slice(2));

if (TelegramOptions.h || TelegramOptions.help) {
    const Help = [];
    console.log(Help.join("\n"));
    process.exit(0)
}

const HelpAndStart = [
    "Hello, welcome to Bds Maneger Telegram Bot",
    "",
    "We are changing some things but everything is working!!",
    "Options:",
    "   /start or /help: This message!",
    "   /basic",
    "       start, stop",
    "   ",
]

// Set Telegram Bot
const bot = new Telegraf(bds.telegram_token);

// Start and Help Command
bot.start((ctx)=>ctx.reply(HelpAndStart.join("\n")));
bot.help((ctx)=>ctx.reply(HelpAndStart.join("\n")));

const ChatIDs = {}
function SaveID(id = "a"){return ChatIDs[id] = true}
function RemoveID(id = "a"){return delete ChatIDs[id]}
function GetID(){return ChatIDs}

// Basic server
bot.command("basic", ctx => {
    const text = ctx.message.text.replace("/basic", "").trim();
    if (/start/.test(text)) {
        if (Detect()) ctx.reply("Stop Server");
        else {
            try {
                const Server = bds.start();
                Server.log(function (data){
                    Object.getOwnPropertyNames(GetID()).forEach(Id => {
                        console.log(Id);
                        if (ChatIDs[Id]) bot.telegram.sendMessage(Id, data)
                    })
                })
                return ctx.reply("Server Started")
            } catch (err) {
                console.log(err)
                ctx.reply("We couldn't start the server")
                ctx.reply(err.toString());
            }
        }
    } else if (/stop/.test(text)) {
        if (Detect()) {
            try {
                bds.stop()
                ctx.reply("Stopping your server")
            } catch (err) {
                ctx.reply("We had an error for your server");
                ctx.reply(err.toString());
            }
        } else ctx.reply("Your server is stopped")
    } else return ctx.reply("Invalid option, they are just: start, stop")
});

// Select Platform
bot.command("platform", ctx => {
    const text = ctx.message.text.replace("/platform", "").trim();
    try {
        bds.BdsSettigs.UpdatePlatform(text);
        return ctx.reply(`Platform update to ${text}`)
    } catch (err) {
        ctx.reply("We were unable to change the platform")
        return ctx.reply(err.toString())
    }
})

// Send Info
bot.command("info", ctx => {
    const config = bds.get_config();
    const InfoRes = [
        `Bds Maneger core version: ${bds.package_json.version}`,
        "",
        "* System Info:",
        `   Kernel:       ${GetKernel()}`,
        `   Arch:         ${arch}`,
        `   System:       ${system}`,
        "",
        "* Server:",
        `   platform:     ${GetPlatform()}`,
        `   world_name:   ${config.world}`,
        `   running:      ${bds.detect()}`,
        `   port:         ${config.portv4}`,
        `   port6:        ${config.portv6}`,
        `   max_players:  ${config.players}`,
        `   whitelist:    ${config.whitelist}`,
    ]
    return ctx.reply(InfoRes.join("\n"))
});

// Log
bot.command("log", ctx => {
    try {
        // 4096
        const Log = fs.readFileSync(path.resolve(GetPaths("log"), "latest.log"), "utf8")
        if (Log.length >= 4096) ctx.reply(Log.substr(-4096));
        else ctx.reply(Log)
    } catch (err) {
        ctx.reply(err.toString())
    }
});

// Live Log User
bot.command("live_log", ctx => {
    const option = ctx.message.text.replace("/platform", "").trim();
    if (/enable/.test(option)) {
        SaveID(ctx.from.id)
        console.log(GetID())
    } else if (/disable/.test(option)) {
        RemoveID(ctx.from.id)
        console.log(GetID())
    } else ctx.reply("Invalid option")
    ctx.reply(ctx.chat.id)
})

// catch
bot.catch(console.log);

// End And Lauch
process.on("exit", bot.stop)
bot.launch()