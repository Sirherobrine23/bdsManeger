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
/command
/list
The messages are re-transmitted to the minecraft chat if it is already connected: ✔
Message Control: ❌`
    ctx.reply(amenssagem)
})
bot.help((ctx) => ctx.reply('Use o /start'))
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.command('server_start', (ctx) => {
    if (require('./check').checkUser(ctx.message.from.username)){
        const bds_status = require('../../index').detect()
        if (!bds_status){
            if (require('../../index').electron){
                document.getElementById('startButtom').click()
            } else {
                require('../../index').start()
            };            
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
        const bds_status = require('../../index').detect()
        if (bds_status){
            require('../../index').stop()
            ctx.reply(`O servidor esta parando`)
        } else 
            ctx.reply(`${ctx.message.from.username} o servidor está parado`)
    } else {
        console.log('Erro');
        ctx.reply(`Please contact the Server Administrator, You are not on the list, I count to add your username \(${ctx.message.from.username}\) on the whitelist`)
    };
});
bot.command('command', (ctx) =>{
    const bds_command = require('../../index').command
    var command = ctx.message.text.replace('/command ', '');
    console.log(`Comandos para o servidor foram recebidos: ${command}`)
    const fs = require('fs');
    const bds = require('../../index');
    const detect_log_file = fs.existsSync(bds.log_file);
    bds_command(command)
    if (detect_log_file){
        const old = fs.readFileSync(bds.log_file, 'utf8');
        setTimeout(() => {
            var out = fs.readFileSync(bds.log_file, 'utf8');
            var name = out.replace(old, '');
            ctx.reply(name)
        }, 1000);   
    } else {
        ctx.reply('Não temos um arquivo log')
    }
});
bot.command('list', (ctx) =>{
    const bds_command = require('../../index').command
    const fs = require('fs');
    const bds = require('../../index');
    const detect_log_file = fs.existsSync(bds.log_file);
    bds_command('list')
    if (detect_log_file){
        const old = fs.readFileSync(bds.log_file, 'utf8');
        setTimeout(() => {
            var out = fs.readFileSync(bds.log_file, 'utf8');
            var name = out.replace(old, '');
            ctx.reply(name)
        }, 1000);   
    } else {
        ctx.reply('NO log file to get list player')
    }
});
// bot.command('mcpe', (ctx) =>{
//     const fs = require('fs');
//     const bds = require('../../index');
//     const path = require('path')
//     if (!(fs.existsSync(path.join(bds.tmp_dir, 'mcpe.apk')))){
//         require('../drive/auth').mcpe()
//     }
//     // doc = fs.ReadStream(path.join(bds.tmp_dir, 'mcpe.apk'))
//     let te = 0;
//     if (typeof mcpe_file_end == 'undefined'){
//         global.mcpe_file_end = true
//     }
//     while (te++ < te++ + 1){
//         if (mcpe_file_end){
//             break
//         } else if (mcpe_file_end == undefined){
//             ctx.reply('Um erro ocorreu');
//             break
//         } else {
//             te++
//         }
//         process.stdout.clearLine();
//         process.stdout.cursorTo(0);
//         process.stdout.write(`Teste ${te}`);
//     }
//     var buff = fs.ReadStream(path.join(bds.tmp_dir, 'mcpe.apk'));
//     console.log(`mcpe.apk buffer: ${buff}`)

//     // delete(mcpe_file_end)
//     const requestListener = function (req, res) {
//         res.writeHead(200);
//         res.end(buff);
//     }

//      const server = http.createServer(requestListener);
//      server.listen(8187);
//     // ctx.replyWithDocument({ source: buff}, {filename: 'Bds.apk' })
//     ctx.reply('http://localhost:8187')
//     // https://telegraf.js.org/#/?id=senddocument
// });
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