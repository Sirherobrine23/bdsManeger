const { Telegraf } = require('telegraf')
const token  = require('../../index').token
const bot = new Telegraf(token)
bot.start((ctx) => {
    ctx.reply(`Hello ${ctx.message.from.username}\nWe have some things still being done in the programming of the new bot more works 👍:\n\nCommands:\n/server_start\n/server_stop\n/server_restart\n/log\n/command: Commands are not working in this version, wait until it is broken\n\nThe messages are re-transmitted to the minecraft chat if it is already connected: ✔\nMessage Control: ❌`)
})
bot.help((ctx) => ctx.reply('Use o/start'))
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.command('server_start', (ctx) => {
    if (require('./check').checkUser(ctx.message.from.username)){
        console.log('Sucess')
        ctx.reply(`Under maintenance ${ctx.message.from.username}`)
    } else {
        console.log('Erro');
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username \(${ctx.message.from.username}\) on the whitelist`)
    };
});
bot.command('server_stop', (ctx) => {
    if (require('./check').checkUser(ctx.message.from.username)){
        console.log('Sucess')
        ctx.reply(`Under maintenance ${ctx.message.from.username}`)
    } else {
        console.log('Erro');
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username \(${ctx.message.from.username}\) on the whitelist`)
    };
});
bot.command('command', (ctx) =>{
    let commands = 'Commands are disabled globally, wait for some version that supports';
    ctx.reply(commands)
});
bot.command('log', (ctx) => {
    const file_log_path = require('../../index').log_file;
    const fs = require("fs")
    if (fs.existsSync(file_log_path)){
        const text = fs.readFileSync(file_log_path, 'utf8')
        ctx.reply(text)
    } else 
        ctx.reply('there is no log');
});
module.exports = bot;