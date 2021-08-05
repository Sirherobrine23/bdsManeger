const { Telegraf, Markup } = require("telegraf");
const bds = require("../index");
const { GetPlatform } = require("../lib/BdsSettings");
const { GetKernel, arch, system } = require("../lib/BdsSystemInfo");
const { Detect } = require("../src/CheckKill");

// Bot Start And Help messages
const HelpAndStart = [
    "Hello, welcome to Bds Maneger Telegram Bot",
    "",
    "We are changing some things but everything is working!!",
    "Options:",
    "   /start or /help: This message!",
    "   /basic",
    "       start, stop",
    "   /live_log",
    "       enabler,disabler",
    "   ",
]

// Set Telegram Bot
const bot = new Telegraf(bds.telegram_token);

// Start and Help Command
bot.start((ctx)=>ctx.reply(HelpAndStart.join("\n")));
bot.help((ctx)=>ctx.reply(HelpAndStart.join("\n")));

// Basic server
bot.command("basic", ctx => {
    const text = ctx.message.text.replace("/basic", "").trim();
    if (/start/.test(text)) {
        if (Detect()) ctx.reply("Stop Server");
        else {
            try {
                const Server = bds.start();
                Server.log(function (data){
			for (let stx of global.LiveLog) stx.reply(data);
		});
		global.ServerExec = Server;
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
});

bot.command("platform_beta", async ctx => {
    const Keyboard = Markup.keyboard([
        "/platform bedrock",
        "/platform java",
        "/platform pocketmine",
        "/platform jsprismarine"
    ]).oneTime().resize();
    ctx.reply("Select Platform", Keyboard)
});

// Send Info
bot.command("info", ctx => {
    const config = bds.get_config();
    const InfoRes = [
        `Bds Maneger core version: ${bds.package_json.version}`,
        "",
        "* System Info:",
        `   Kernel ------ ${GetKernel()}`,
        `   Arch -------- ${arch}`,
        `   System -----  ${system}`,
        "",
        "* Server:",
        `   platform ---- ${GetPlatform()}`,
        `   world_name -- ${config.world}`,
        `   running ----- ${bds.detect()}`,
        `   port_V4 ----- ${config.portv4}`,
        `   port_V6 ----- ${config.portv6}`,
        `   max_players - ${config.players}`,
        `   whitelist --- ${config.whitelist}`,
    ]
    return ctx.reply(InfoRes.join("\n"));
});

// Live Log User
global.LiveLog = [];
bot.command("live_log", ctx => {
    const option = ctx.message.text.replace("/live_log", "").trim();
    if (/enable/.test(option)) {
        global.LiveLog.push(ctx);
        return ctx.reply("Sucess");
    } else if (/disable/.test(option)) {
        // ctx.from.id
        for (let ctx_Logs in global.LiveLog) {
            if (global.LiveLog[ctx_Logs].from.id === ctx.from.id) {
                delete global.LiveLog[ctx_Logs];
                global.LiveLog = global.LiveLog.filter(a=>a);
                return ctx.reply("Ok");
            }
        }
        return ctx.reply("You are not in the list");
    } else return ctx.reply("Invalid option");
});

// text
bot.on("message", ctx => global.ServerExec.command(`say ${ctx.message.text}`));

// catch
bot.catch(console.log);

// End And Lauch
bot.launch();