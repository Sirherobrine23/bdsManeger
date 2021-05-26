const { Telegraf } = require("telegraf");
const { start, detect, telegram_token, valid_platform, arch, package_json, latest_log, kill } = require("../index");
const { checkUser } = require("./check");
const IsElectron = process.argv[0].includes("electron");
const { readFileSync } = require("fs");
const FetchSync = require("../fetchSync");

function boot_telegram_bot(){
    function getExec() {
        return global.BdsExecs[Object.getOwnPropertyNames(global.BdsExecs)[0]]
    }
    // Set Telegram Bot
    const bot = new Telegraf(telegram_token)
    bot.start((ctx) => {
        const replymessage =[
            `Hello ${ctx.message.from.username}`,
            "We have some things still being done in the programming of the new bot more works 👍:",
            "Commands:",
            "-   /server_start, start your server and have all the logs in your chat ⚙️",
            "-   /server_stop, stop your server in the simplest way 🏃⏱️⏱️",
            "-   /server_kill, kill all bds maneger severs",
            "-   /log",
            "-   /command",
            "-   /list, deprecated",
            "-   /mcpe, get latest minecraft bedrock version for Android, iPhone not privileged",
            "The messages are re-transmitted to the minecraft chat if it is already connected: ✔",
            "Message Control: ❌",
        ]
        ctx.reply(replymessage.join("\n"))
    })
    bot.help((ctx) => ctx.reply("Its alive"));
    bot.command("server_start", (ctx) => {
        if (checkUser(ctx.message.from.username)){
            if (detect()) ctx.reply(`${ctx.message.from.username} already started`);
            else if (IsElectron) ctx.reply(`${ctx.message.from.username} is electron`);
            else {
                global.isTelegrambot = true
                const server = start();
                server.log(data => ctx.reply(data));
                server.exit(code => ctx.reply(`The Bds Maneger wit uuid ${server.uuid} exit with code ${code}`));
            }
        } else {
            console.log(`It was not started for ${ctx.message.from.username} as it is not an administrator`);
            ctx.deleteMessage()
            ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username (${ctx.message.from.username}) on the whitelist`)
        }
    });
    bot.command("server_kill", (ctx) => {
        if (checkUser(ctx.message.from.username)){
            if (!(detect())){
                if (kill()) ctx.reply("Killed servers");else ctx.reply("No killed servers")
            } else ctx.reply(`${ctx.message.from.username} no detect bds servers`);
        } else {
            console.log(`It was not started for ${ctx.message.from.username} as it is not an administrator`);
            ctx.deleteMessage()
            ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username (${ctx.message.from.username}) on the whitelist`)
        }
    });
    bot.command("server_stop", (ctx) => {
        if (checkUser(ctx.message.from.username)){
            if (detect()){
                getExec().stop();
                ctx.reply("The server is stopping, wait for a few moments")
            } else ctx.reply(`Hello ${ctx.message.from.username}, the server will remain stopped`);
        } else {
            console.log(`It was not stoped for ${ctx.message.from.username} as it is not an administrator`);
            ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username (${ctx.message.from.username}) on the whitelist`)
        }
    });
    bot.command("command", (ctx) => {
        const Usercommand = ctx.message.text.replace("/command", "").trim().split(/\s+/).join(" ")
        if (detect()){
            if (Usercommand === "") ctx.reply("Check you command");
            else {
                if (checkUser(ctx.message.from.username)) getExec().command(Usercommand, text => {if (!(global.isTelegrambot)) ctx.reply(text)});
            }
        } else ctx.reply("Start Server")
    });
    bot.command("mcpe", (ctx) => {
        const Androidapks = FetchSync("https://raw.githubusercontent.com/Sirherobrine23/Minecraft_APK_Index/main/Android.json").json();
        Androidapks.Oficial_latest
        const markdown = [
            `Minecraft Bedrock android: [${Androidapks.Oficial_latest}](${Androidapks.Oficial[Androidapks.Oficial_latest].url})`,
            "",
            "iPhone users are not privileged, by [Sirherobrine23](https://sirherobrine23.org)"
        ]
        ctx.replyWithMarkdown(markdown.join("\n"))
    });
    bot.command("info", (ctx) =>{
        const info = [
            `Bds Maneger core version: **${package_json.version}**`,
            `System: *${process.platform}*, Arch: *${arch}*`,
            "---------------------- Supported platforms ----------------------",
            `Server support for *${arch}* architecture:`,
            "",
            ` - Bedrock: *${valid_platform.bedrock}*`,
            ` - Java: *${valid_platform.java}*`,
            ` - Pocketmine: *${valid_platform.pocketmine}*`,
            ` - JSPrismarine: *${valid_platform.jsprismarine}*`,
        ];
        ctx.replyWithMarkdown(info.join("\n"));
    });
    bot.command("log", (ctx) => {
        if (checkUser(ctx.message.from.username)) {
            const logFile = readFileSync(latest_log, "utf8").toString();
            if (logFile.length > 4096) ctx.reply(logFile.substr(-4095));
            else ctx.reply(logFile);
        } else ctx.reply(`${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}), you are not an admin to view the log`);
    });
    process.on("exit", function (){bot.stop()})
    return bot.launch()
}
module.exports = boot_telegram_bot
module.exports.launch = boot_telegram_bot