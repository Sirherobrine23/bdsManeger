function botV(){
    const { Telegraf } = require('telegraf')
    const bot = new Telegraf(require('../../index').token)
    bot.start((ctx) => {
        ctx.reply(`Hello ${ctx.message.from.username}\nWe have some things still being done in the programming of the new bot more works 👍:\n\nCommands:\n/server_start\n/server_stop\n/server_restart\n/log\n/command: Commands are not working in this version, wait until it is broken\n\nThe messages are re-transmitted to the minecraft chat if it is already connected: ✔\nMessage Control: ❌`)
    })
    bot.help((ctx) => ctx.reply('Use o/start'))
    bot.action('delete', ({ deleteMessage }) => deleteMessage())
    /*bot.on('message', (ctx) => {
        ctx.telegram.sendCopy(ctx.chat.id, ctx.message)
        console.log(ctx.message.text);
        console.log(ctx.message.from.username);
    })*/
    bot.command('server_start', (ctx) => {
        // ctx.reply('Hello')
        if (require('./check').checkUser(ctx.message.from.username)){
            console.log('Sucess')
            ctx.reply(`Under maintenance ${ctx.message.from.username}`)
        } else {
            console.log('Erro');
            ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username \(${ctx.message.from.username}\) on the whitelist`)
        };
    });
    bot.command('server_stop', (ctx) => {
        // ctx.reply('Hello')
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
        if (fs.existsSync(require('../../index').log_file))
            var logB = require("fs").readSync(require('../../index').log_file);
        else 
            var logB = 'there is no log';
        ctx.reply(logB)
    });
    bot.launch()
}
module.exports = botV;