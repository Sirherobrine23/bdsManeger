function date(fu) {
    var today = new Date();
    if (fu == 'year')
        return `${today.getFullYear()}`
    else if (fu == 'day')
        return `${String(today.getDate()).padStart(2, '0')}`
    else if (fu == 'month')
        return `${String(today.getMonth() + 1).padStart(2, '0')}`
    else if (fu == 'hour')
        return `${today.getHours()}_${today.getMinutes()}`
    else 
        return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}_${today.getHours()}-${today.getSeconds()}`
}
if (process.argv[0].includes('electron')){
    var electron_de = true;
} else if (process.argv[0].includes('node')){
    var electron_de = undefined;
} else {
    var electron_de = false;
}
const path = require('path')
const fs = require('fs');
const package_root = path.join(process.cwd(), 'package.json')
if (process.platform == 'win32') {
    var home = process.env.USERPROFILE;
    var server_dir = path.join(home, `bds_Server`);
    if (fs.existsSync(package_root)){
        var cache_dir = path.join(home, 'AppData', 'Roaming', require(package_root).name)
    } else {
        console.warn(`Temporary Storages, some functions will be lost after restarting the system`)
        var cache_dir = path.join(process.env.TMP, `bds_tmp_configs`);
    }
    var log_dir = path.join(server_dir, 'log')
    var log_file = path.join(log_dir, `${date()}_Bds_log.log`)
    var log_date = `${date()}`
    var tmp = process.env.TMP
    var system = `windows`;
} else if (process.platform == 'linux') {
    var home = process.env.HOME;
    var server_dir = path.join(home, 'bds_Server');
    if (fs.existsSync(package_root)){
        var cache_dir = path.join(home, '.config', require(package_root).name);
    } else {
        console.warn(`Temporary Storages, some functions will be lost after restarting the system`)
        var cache_dir = `/tmp/bds_tmp_configs`;
    }
    var log_dir = path.join(server_dir, 'log')
    var log_file = path.join(log_dir, `${date()}_Bds_log.log`)
    var log_date = `${date()}`
    var tmp = `/tmp`
    var system = `linux`;
} else if (process.platform == 'android') {
    require("open")("https://github.com/Bds-Maneger/Bds_Maneger/wiki/systems-support#a-message-for-android-users")
    console.error('Android is not yet supported by bds manager')
    process.exit(2007)
    var home = `/data/data/com.temux/files/home`;
    var server_dir = path.join(home, 'bds_Server');
    var cache_dir = path.join(home, '.bds_configs', require(package_root).name);
    var log_dir = path.join(server_dir, 'log')
    var log_file = path.join(log_dir, `${date()}_Bds_log.log`)
    var log_date = `${date()}`
    var tmp = `/tmp`
    var system = `linux`;
} else if (process.platform == 'darwin') {
    require("open")("https://github.com/Bds-Maneger/Bds_Maneger/wiki/systems-support#a-message-for-mac-os-users")
    console.error('Please use Windows or Linux MacOS Not yet supported')
    process.exit(1984)
} else {
    console.log(`Please use an operating system (OS) compatible with Minecraft Bedrock Server ${process.platform} is not supported`);
    process.exit(2021)
};
var shell = require('shelljs');
if (!(fs.existsSync(cache_dir))){
    console.log(`Creating a folder for Storage in ${cache_dir}`);
    shell.mkdir('-p', cache_dir);
}
if (!(fs.existsSync(server_dir))){
    console.log('Creating the bds directory')
    shell.mkdir('-p', server_dir);
}
if (fs.existsSync(server_dir)){
    if (!fs.existsSync(log_dir)){
        console.log('Creating the bds log dir')
        shell.mkdir('-p', log_dir);
    };
};
if (require("fs").existsSync(`${server_dir}/telegram_token.txt`)){
    module.exports.token = require("fs").readFileSync(`${server_dir}/telegram_token.txt`, "utf8").replaceAll('\n', '');
} else {
    module.exports.token = undefined;
}

// Depacretd function
module.exports.Storage = () => {
    var LocalStorage = require('node-localstorage').LocalStorage;
    return new LocalStorage(`${cache_dir}/Local_Storage`)();
};

module.exports.telegram_token_save = (token) =>{
    fs.writeFileSync(`${server_dir}/telegram_token.txt`, token)
    return 'OK'
}

// Set commands
if (typeof fetch === 'undefined'){
    global.fetch = require('node-fetch')
}

if (typeof LocalStorage === 'undefined'){
    var LocalStorage = require('node-localstorage').LocalStorage;
    global.LocalStorage = new LocalStorage(`${cache_dir}/Local_Storage`);
}
let blanks;
if (process.env.BDS_MONI == blanks){
    process.env.BDS_MONI = 'false'
}
// process.env.BDS_MONI
if (process.env.ENABLE_BDS_API == blanks){
    process.env.ENABLE_BDS_API = 'false'
}
// process.env.ENABLE_BDS_API


// Fetchs
fetch('https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/credentials.json').then(response => response.text()).then(gd_cre => {
    module.exports.google_drive_credential = gd_cre
    module.exports.drive_backup = require('./Services/drive/auth').drive_backup
    module.exports.mcpe_file = require('./Services/drive/auth').mcpe
});
fetch('https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json').then(response => response.json()).then(rawOUT => {
    for (let v in rawOUT.Versions){
        var html = `${rawOUT.Versions[v]}`;
        var out = `${out}\n <option value=\"${html}\">${html}</option>`;
        v++;
    };
    module.exports.version_select = out.replaceAll(undefined, '');
    module.exports.version_raw = rawOUT.Versions;
    module.exports.bds_latest = rawOUT.latest;
    const enable_api = process.env.ENABLE_BDS_API.includes('true')
    if (enable_api){
        if (typeof bds_api_start === 'undefined'){
            module.exports.api = require('./API/api')()
        } else {
            console.log(`API already started`)
        }
    } else {
        console.warn(`The bds Maneger API Rest disabled\nTo Enable!\nJavaScript:\n\nprocess.env.ENABLE_BDS_API = true\n\nexport export ENABLE_BDS_API='true'\n`)
    }
    
    module.exports.get_version = (type) => {
        if (type == 'raw')
            return rawOUT.Versions;
        else
            return out.replaceAll(undefined, '');
    }
})
// Fetchs

// 
// Module export
/* Variaveis */

module.exports.home = home
module.exports.system = system
module.exports.server_dir = server_dir
module.exports.world_dir = path.join(server_dir, 'worlds')
module.exports.tmp_dir = tmp
module.exports.electron = electron_de
module.exports.api_dir = cache_dir
module.exports.log_file = log_file
module.exports.log_date = log_date

/* Commands server */
module.exports.detect = require("./Services/detect_bds").bds_detect
module.exports.telegram = require("./Services/telegram/telegram_bot")
module.exports.start = require('./Services/start').Server_start
module.exports.stop = require('./Services/stop').Server_stop
module.exports.date = date
module.exports.command = require('./Services/command').command
module.exports.backup = require("./Services/backup").World_BAckup
module.exports.kill = require("./Services/kill").bds_kill
module.exports.version_Download = require("./Services/download").DownloadBDS
module.exports.set_config = require("./Services/bds_settings").config
module.exports.get_config = require("./Services/bds_settings").get_config
module.exports.config_example = require("./Services/bds_settings").config_example
module.exports.token_register = () => {
    if (!(fs.existsSync(path.join(server_dir, "bds_tokens.json")))){
        fs.writeFileSync(path.join(server_dir, "bds_tokens.json"), '[]')
    }
    require('crypto').randomBytes(10, function(err, buffer) {
        var token = buffer.toString('hex');
        console.log(token)
        var QRCode = require('qrcode')
        QRCode.toString(token, function (err, url) {
            fs.readFile(path.join(server_dir, "bds_tokens.json"), 'utf8', function (err, data){
                if (err){
                    console.log(err);
                } else {
                obj = JSON.parse(data); //now it an object
                var count = Object.keys(obj).length
                var teste = {count, token}
                obj.push(teste); //add some data
                json = JSON.stringify(obj); //convert it back to json
                fs.writeFileSync(path.join(server_dir, "bds_tokens.json"), json, 'utf8'); // write it back 
            }});
        })
    });
}
const bds_monitor = process.env.BDS_MONI.includes('true')
if (bds_monitor){
    const si = require('systeminformation');
    setInterval(() => {
        // si.cpu().then(data => {module.exports.cpu_speed = Math.trunc(data.speed)})
        si.mem().then(data => {
            module.exports.ram_free = Math.trunc(data.free / 1024 / 1024 / 1024);
            module.exports.ram_total = Math.trunc(data.total / 1024 / 1024 / 1024);
        })
        si.currentLoad().then(data => {
            module.exports.current_cpu = Math.trunc(data.currentload)
        })

    }, 1000);
    si.processes().then(data => {
        const list = data.list
        for (let pid in list) {
            var pids = list[pid].command
            if (pids.includes('bedrock_server')){
                module.exports.bds_cpu = Math.trunc(list[pid].pcpu)
            } else {
                pid++
            }
        }
    })
    setInterval(() => {
        si.processes().then(data => {
            const list = data.list
            for (let pid in list) {
                var pids = list[pid].command
                if (pids.includes('bedrock_server')){
                    module.exports.bds_cpu = Math.trunc(list[pid].pcpu)
                } else {
                    pid++
                }
            }
        })
    }, 3000);
}else {
    console.warn(`The system CPU\nTo Enable!\nJavaScript:\n\nprocess.env.BDS_MONI = true\n\nexport export BDS_MONI='true'\n`)
}