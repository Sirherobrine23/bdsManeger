const { Telegraf } = require('telegraf')
const token  = require('../../index').token
const bot = new Telegraf(token)
bot.start((ctx) => {
    const amenssagem = `Hello ${ctx.message.from.username}
We have some things still being done in the programming of the new bot more works 👍:
Commands:
/server_start
/server_stop
/server_restart
/log
/command: Commands are not working in this version, wait until it is broken
The messages are re-transmitted to the minecraft chat if it is already connected: ✔
Message Control: ❌`
    ctx.reply(``)
})
bot.help((ctx) => ctx.reply('Use o/start'))
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.command('server_start', (ctx) => {
    if (require('./check').checkUser(ctx.message.from.username)){
        const bds_status = require('../../index').detect()
        if (!bds_status){
            require('../../index').start()
            ctx.reply(`The server has started`)
        } else 
            ctx.reply(`${ctx.message.from.username} already started`)
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