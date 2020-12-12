function date(fu) {
    var today = new Date();
    if (fu == 'year') {    
        return `${today.getFullYear()}`
    } else if (fu == 'day') {
        return `${String(today.getDate()).padStart(2, '0')}`
    }else if (fu == 'month') {
        return `${String(today.getMonth() + 1).padStart(2, '0')}`
    } else if (fu == 'hour'){
        return `${today.getHours()}_${today.getMinutes()}`
    } else {
        return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
    };
}

function StdindWrite(Variable_storaged, command) {
    if (Variable_storaged == undefined) {
        console.error('Child_process Variable?')
    } else {
        if (command == undefined) {
            console.error('command?')
        } else {
            if (command == 'stop'){
                Variable_storaged.stdin.write(`stop\n`)
                Variable_storaged.on('exit', function (code){if (code = 0){delete(Variable_storaged);};});
            } /*End Stop Delete*/ else {
                eval(Variable_storaged.stdin.write(`${command}\n`))
            }
        } /*Command Send*/
    } /*child_process*/
};
function Storage(){
    var LocalStorage = require('node-localstorage').LocalStorage;
    return new LocalStorage(`${require('./').api_dir}/Local_Storage`);
};
if (process.argv[0].includes('electron')){
    var electron_de = true;
} else if (process.argv[0].includes('node')){
    // console.error('Use o Electron, o Node não é totalmente suportado');
    var electron_de = undefined;
} else {
    var electron_de = false;
}
// This script server to forcefully kill old servers without being stopped before closing the application or having reloaded the page, an alternative and safer way is being sought.var
if (process.platform == 'win32') {
    var home = process.env.USERPROFILE;
    var server_dir = `${home}\\bds_Server`;
    var cache_dir = `${home}\\AppData\\Roaming\\bds_maneger_api\\`
    var log_file = `${server_dir}\\${date()}_Bds_log.log`
    var log_date = `${date()}`
    var system = `windows`;
} else if (process.platform == 'linux') {
    var home = process.env.HOME;
    var server_dir = `${home}/bds_Server`;
    var cache_dir = `${home}/.config/bds_maneger_api`
    var log_file = `${server_dir}/${date()}_Bds_log.log`
    var log_date = `${date()}`
    var system = `linux`;
} else if (process.platform == 'darwin') {
    require("shell").openExternal("https://github.com/Sirherobrine23/Bds_Maneger/wiki/systems-support#a-message-for-mac-os-users")
    console.error('Por favor utilize o Windows ou Linux o MacOS Ainda não há suporte')
} else {
    alert(`Por Favor utilize uma sistema operacional (OS) compativel com o Minecraft Bedrock Server o ${process.platform} não é Suportdo`);
    require('electron').remote.app.quit();
}
// 
// Module export
module.exports = {
    start: require('./services/start').Server_start,
    stop: require('./services/stop').Server_stop,
    Storage: Storage,
    date: date,
    command: StdindWrite,
    backup: require("./services/backup").World_BAckup,
    kill: require("./services/kill").bds_kill,
    get_version: require("./services/versions").bds_version_get,
    version_Download: require("./services/download").DownloadBDS,
    detect: require("./services/detect_bds").bds_detect,
    home: home,
    system: system,
    server_dir: server_dir,
    electron: electron_de,
    api_dir: cache_dir,
    log_file: log_file,
    log_date: log_date
}
