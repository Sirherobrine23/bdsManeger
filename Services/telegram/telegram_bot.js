var fs = require("fs");
if (fs.existsSync(`${require('../../index').server_dir}/token.txt`)){
    var token = fs.readFileSync(`${require('../../index').server_dir}/token.txt`, "utf-8").replaceAll('\n', '');
} else {
    var token = null;
};
const { Telegraf } = require('telegraf')
const bot = new Telegraf(token)
bot.start((ctx) => {
    var markdown = `Hello ${ctx.message.from.username}
We have some things still being done in the programming of the new bot more works 👍:

Commands:
/server_start
/server_stop
/server_restart
/log
/command

<br>---------<br>

The messages are re-transmitted to the minecraft chat if it is already connected: ✔
Message Control: ❌
`
ctx.reply(markdown)
})
bot.help((ctx) => ctx.reply('Help message'))
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
        ctx.reply(`Em manuteção ${ctx.message.from.username}`)
    } else {
        console.log('Erro');
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username \(${ctx.message.from.username}\) on the whitelist`)
    };
});
bot.command('server_stop', (ctx) => {
    // ctx.reply('Hello')
    if (require('./check').checkUser(ctx.message.from.username)){
        console.log('Sucess')
        ctx.reply(`Em manuteção ${ctx.message.from.username}`)
    } else {
        console.log('Erro');
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username \(${ctx.message.from.username}\) on the whitelist`)
    };
});
bot.command('server_restart', (ctx) => {
    // ctx.reply('Hello')
    if (requir('/check').checkUser(ctx.messge.from.username)){
        console.log('Sucess')
        ctx.reply(`Em manuteção ${ctx.message.from.username}`)
    } else {
        console.log('Erro');
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username \(${ctx.message.from.username}\) on the whitelist`)
    };
});

bot.command('log', (ctx) => {
    // ctx.reply('Hello')
    fs.readSync(`${requie('../../index').server_dir}/`)
    ctx.reply(LOGBDS)
});
bot.launch()

module.exports = {}