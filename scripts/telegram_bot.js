function boot_telegram_bot(){
    const { Telegraf } = require("telegraf");
    const {start, stop, detect, players_files, telegram_token} = require("../index");
    const bds_command = require("../index").command;
    const {checkUser} = require("./check");
    const IsElectron = process.argv[0].includes("electron");
    const {readFileSync} = require("fs");
    const {resolve} = require("path");
    // Set Telegram Bot
    const bot = new Telegraf(telegram_token)
    bot.start((ctx) => {
        const amenssagem = `Hello ${ctx.message.from.username}
We have some things still being done in the programming of the new bot more works 👍:
Commands:
/server_start
/server_stop
/server_restart
/log
/command
/list
/mcpe
/status
The messages are re-transmitted to the minecraft chat if it is already connected: ✔
Message Control: ❌`
        ctx.reply(amenssagem)
    })
    bot.help((ctx) => ctx.reply("Use o /start"))
    bot.action("delete", ({ deleteMessage }) => deleteMessage())
    bot.command("server_start", (ctx) => {
        if (checkUser(ctx.message.from.username)){
            if (!(detect())){
                if (IsElectron) document.getElementById("startButtom").click(); else start()
                ctx.reply("Server Started please wait a few moments")
            } else ctx.reply(`${ctx.message.from.username} already started`);
        } else {
            console.log(`It was not started for ${ctx.message.from.username} as it is not an administrator`);
            ctx.deleteMessage()
            ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username (${ctx.message.from.username}) on the whitelist`)
        }
    });
    bot.command("server_stop", (ctx) => {
        if (checkUser(ctx.message.from.username)){
            if (detect()){stop();ctx.reply("The server is stopping, wait for a few moments")}
            else ctx.reply(`Hello ${ctx.message.from.username}, the server will remain stopped`);
        } else {
            console.log(`It was not stoped for ${ctx.message.from.username} as it is not an administrator`);
            ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username (${ctx.message.from.username}) on the whitelist`)
        }
    });
    bot.command("command", (ctx) => {
        let command = ctx.message.text.replace("/command", "")
        if (command === "") ctx.reply("Check you command");
        else if (command === " ") ctx.reply("Check you command");
        else {bds_command(command);ctx.reply("Check /log")}
    });
    bot.command("list", (ctx) =>{
        const current_user = JSON.parse(readFileSync(players_files, "utf8")),
            connected = readFileSync(resolve(__dirname, "..", "static_files", "list_user.md"), "utf8")
        for (let userN in current_user){
            let user = current_user[userN]
            let date = new Date(user.date)
            ctx.replyWithMarkdown(connected
                .split("@PLAYER").join(user.player)
                .split("@JSON_H").join(JSON.stringify(user.update))
                .split("@DATA").join(`${date.getUTCDay()}/${date.getUTCMonth()}/${date.getUTCFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCMilliseconds()} UTC`)
                .split("@CONNECTED").join(user.connected)
            )
        }
    });
    bot.command("mcpe", (ctx) =>{
    ctx.replyWithMarkdown(`[Minecraft for Android Latest](https://f.sh23.org/Minecraft/Mcpe/Oficial/1.16.210.05.apk)

    iPhone users are not privileged, by Sirherobrine23`)});
    bot.command("status", (ctx) =>{
        const current_user = JSON.parse(readFileSync(players_files, "utf8"))
        var connected = 0,
        player = ""
        for (let con in current_user){
            if (current_user[con].connected) {connected = connected + 1;player += `- ${current_user[con].player}\n\n`}
        }
    const text = `-------- Bds Core --------
------------ Players ------------

- Players currently logged on to the server: ${connected}

${player}`
        ctx.reply(text);
    });
    bot.command("log", (ctx) => {
        const file_log_path = require("../index").log_file;
        const fs = require("fs")
        if (fs.existsSync(file_log_path)){
            const text = fs.readFileSync(file_log_path, "utf8")
            ctx.reply(text)
        } else 
            ctx.reply("there is no log");
    });
    bot.launch()
    return true
}
module.exports = boot_telegram_bot
module.exports.launch = boot_telegram_bot