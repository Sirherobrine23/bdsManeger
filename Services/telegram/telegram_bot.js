var fs = require("fs");
if (fs.existsSync(`${require('../../index').server_dir}/token.txt`)){
    var token = fs.readFileSync(`${require('../../index').server_dir}/token.txt`, "utf-8").replaceAll('\n', '');
} else {
    var token = null;
};
const { Telegraf } = require('telegraf')
const bot = new Telegraf(token)
bot.start((ctx) => ctx.replyWithMarkdown(`Hello ${ctx.message.from.username}
Temos Algumas Coisas ainda sendo feitas na programação do novo bot Mais funcional 👍:

*Comandos:*
/server_start
/server_stop
/server_restart
/log
/command

- [x] As mensagens são reetransmitidas para o chat do minecraft caso ele estejá ligado`))
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
        ctx.reply(`Por Favor contate o Administrador do Servidor, Você não está na lista, conteo para adicionar seu username \(${ctx.message.from.username}\) na whitelist`)
    };
})
bot.launch()