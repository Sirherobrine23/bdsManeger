const { Telegraf } = require("telegraf")
const token  = require("../index").telegram_token
const bot = new Telegraf(token)
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
    if (require("./check").checkUser(ctx.message.from.username)){
        const bds_status = require("../index").detect()
        if (!bds_status){
            if (require("../index").electron){
                document.getElementById("startButtom").click()
            } else {
                require("../index").start()
            }            
            ctx.reply("The server has started")
        } else 
            ctx.reply(`${ctx.message.from.username} already started`)
    } else {
        console.log("Erro");
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username (${ctx.message.from.username}) on the whitelist`)
    }
});
bot.command("server_stop", (ctx) => {
    if (require("./check").checkUser(ctx.message.from.username)){
        const bds_status = require("../index").detect()
        if (bds_status){
            require("../index").stop()
            ctx.reply("O servidor esta parando")
        } else 
            ctx.reply(`${ctx.message.from.username} o servidor está parado`)
    } else {
        console.log("Erro");
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username (${ctx.message.from.username}) on the whitelist`)
    }
});
bot.command("command", (ctx) =>{
    const bds_command = require("../index").command
    var command = ctx.message.text.replace("/command ", "");
    console.log(`Comandos para o servidor foram recebidos: ${command}`)
    const fs = require("fs");
    const bds = require("../index");
    const detect_log_file = fs.existsSync(bds.log_file);
    bds_command(command)
    if (detect_log_file){
        const old = bds_log_string;
        setTimeout(() => {
            var name = bds_log_string.replace(old, "");
            ctx.reply(name)
        }, 1000);   
    } else {
        ctx.reply("Não temos um arquivo log")
    }
});
bot.command("list", (ctx) =>{
    const bds_command = require("../index").command
    const fs = require("fs");
    const bds = require("../index");
    const detect_log_file = fs.existsSync(bds.log_file);
    if (detect_log_file){
        bds_command("list")
        var old = bds_log_string;
        setTimeout(() => {
            var name = bds_log_string.replace(old, "End\n\n");
            ctx.reply(name)
        }, 1000);   
    } else {
        ctx.reply("NO log file to get list player")
    }
});
bot.command("mcpe", (ctx) =>{
ctx.replyWithMarkdown(`[Minecraft for Android 1.16.201.01](https://files.sh33.org/mcpe/latest.sonic)

Iphone users are not privileged
`)});
bot.command("status", (ctx) =>{
const {bds_cpu, current_cpu, ram_total, ram_free} = require("./system_monitor")
const text = `Bds CPU usage: ${bds_cpu}%, Total CPU utilization: ${current_cpu}%

Total ram memory: ${ram_total} GB, Total free ram memory: ${ram_free} GB`
ctx.replyWithMarkdown(text);
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
module.exports = bot;
