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
    if (require('os').release().includes('10.')) {
        var home = process.env.USERPROFILE.replaceAll('\\', '/');
        var server_dir = `${home}/bds_Server`;
        var system = `windows`;
    } else {
        alert(`Alerta \"Utilize o Windows 10 OU Windows Server 2016\"`);
        require('electron').remote.app.quit();
    }
} else if (process.platform == 'linux') {
    var home = process.env.HOME;
    var server_dir = `${home}/bds_Server`;
    var system = `linux`;
} else if (process.platform == 'darwin') {
    console.error('Por favor utilize o Windows ou Linux o MacOS Ainda não há suporte')
} else {
    alert(`Por Favor utilize uma sistema operacional (OS) compativel com o Minecraft Bedrock Server o ${process.platform} não é Suportdo`);
    require('electron').remote.app.quit();
}

function bds_kill() {
    var spawn = require('child_process').exec;
    if (require('bds_maneger_api').detect()){
        console.log('kill all Minecraft Bedrock Servers')
        if (process.platform == 'win32') {
            var killbds = spawn(`tasklist /fi "imagename eq bedrock_server.exe" | find /i "bedrock_server.exe" > nul & if not errorlevel 1 (taskkill /f /im "bedrock_server.exe" > nul && exit 0) else (exit 1)`);
        } else if (process.platform == 'linux') {
            var killbds = spawn(`kill $(ps aux|grep -v 'grep'|grep 'bedrock_server'|awk '{print $2}')`, {
                shell: true
            });
        };
        killbds.on('exit', function (code) {
            console.log('kill Sucess')
            killbds.stdin.end();
        });
        return 'Killed'
    } else {
        return 'Não há nada para mater'
    };
};

function World_BAckup() {
    if (process.platform == "win32") {
        
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        var hour = today.getHours();
        var minu = today.getMinutes();
        today = `Date_${yyyy}-${mm}-${dd}(Hour_${hour}-Minutes_${minu})`;
        var name = `${process.env.USERPROFILE}/Desktop/bds_backup_World_${today}.zip`
        var dir_zip = `require('bds_maneger_api').server_dir/worlds/`
    } else if (process.platform == 'linux') {
        
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        var hour = today.getHours();
        var minu = today.getMinutes();
        today = `Date_${yyyy}-${mm}-${dd} Hour_${hour}-Minutes_${minu}`;
        var name = `${process.env.HOME}/bds_backup_World_${today}.zip`
        var dir_zip = `require('bds_maneger_api').server_dir/worlds/`
    }; /* End Files name */
    /* Compress the folders */
    var AdmZip = require('adm-zip');
    var zip = new AdmZip();
    zip.addLocalFolder(dir_zip); /* var willSendthis = zip.toBuffer(); */
    zip.addZipComment(`Backup zip file in ${today}. \nBackup made to ${process.platform}, Free and open content for all\n\nSirherobrine23© By Bds Maneger.`)
    var zipEntries = zip.getEntries();
    zipEntries.forEach(function (zipEntry) {
        console.log(zipEntry.entryName.toString());
    });
    zip.writeZip(name); /* Zip file destination */
    console.log('Backup Sucess')
    /* Compress the folders */
    return 'Sucess'
};

function bds_version_get(type) {
    var fs = require('fs')
    if (process.platform == 'linux') {
        var TMP = '/tmp/v.json'
    } else if (process.platform == 'win32') {
        var TMP = `${process.env.TMP}/v.json`
    }
    fetch('https://raw.githubusercontent.com/Sirherobrine23/Bds_Maneger-for-Windows/main/Server.json').then(response => response.text()).then(rawOUT => {
        fs.writeFileSync(TMP, rawOUT);
    });
    var vers = JSON.parse(fs.readFileSync(TMP, 'utf8')).Versions
    for (index in vers) {
        if (type == 'raw') {
            var out = `${vers[index]}\n ${out}`
        } else {
            var html = `${vers[index]}`
            var out = `${out}\n <option value=\"${html}\">${html}</option>`
            var html = ''
        };
        index++;
    };
    return out.replace('undefined', '');
};

function DownloadBDS(Vdown) {
    console.log("Iniciando o download");
    // var Vdown = document.getElementById(ID).value
    if (require('bds_maneger_api').electron){
        localStorage.setItem('bds_server_version', Vdown)
    }
    if (process.platform == 'win32') {
        var URLd = `https://minecraft.azureedge.net/bin-win/bedrock-server-${Vdown}.zip`;
    } else if (process.platform == 'linux') {
        var URLd = `https://minecraft.azureedge.net/bin-linux/bedrock-server-${Vdown}.zip`;
    }
    console.log(URLd, NAMEd)
    var NAMEd = `bedrock-server-${Vdown}.zip'`
    // 
    var exec = require('child_process').exec;
    if (process.platform == 'win32') {
        var downloadBDSchild = exec(`cd %TMP% && curl ${URLd} --output ${NAMEd}`);
    } else if (process.platform == 'linux') {
        var downloadBDSchild = exec(`cd /tmp && curl ${URLd} --output ${NAMEd}`);
    };
    downloadBDSchild.on('exit', function (code) {
        if (code == 0) {
            console.log('download Sucess');
            var old = require('fs').readFileSync(`${require('bds_manegr_api').server_dir}/server.properties`, "utf-8");
            if (process.platform == 'win32') {
                var ZIP_FILE_PATH = `${process.env.TMP}/${NAMEd}`;
            } else if (process.platform = 'linux') {
                var ZIP_FILE_PATH = `/tmp/${NAMEd}`;
            };
            var ZIP_FILE_OUTPUT = `${require('bds_maneger_api').server_dir}`;
            console.log('init extract'); // Unzip
            var AdmZip = require('adm-zip');
            var zip = new AdmZip(ZIP_FILE_PATH);
            zip.extractAllTo(ZIP_FILE_OUTPUT, true);
            console.log('extract Sucess'); // End Unzip
            require('fs').writeFileSync(`${require('bds_manegr_api').server_dir}/server.properties`, old)
            return 'Sucess'
        } /*Erro download*/
        else {
            alert('Erro to download');
            return 'Erro 1'
        }
    });
};

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

function bds_detect() {
    var spawn = require('child_process').execSync;
    if (process.platform == 'win32') {
        var killbds = spawn(`tasklist /fi "imagename eq bedrock_server.exe" | find /i "bedrock_server.exe" > nul & if not errorlevel 1 (echo 0) else (echo 1)`);
    } else if (process.platform == 'linux') {
        var killbds = spawn(`ps aux|grep -v 'grep'|grep 'bedrock_server'|grep -q "bedrock_server";echo $?`, {shell: true});
    };
    if (killbds == 0){
        return true
    } else {
        return false
    }
}


// Module export
module.exports = {
    /*start: Server_Start,
    stop: Server_Stop,*/
    home: home,
    system: system,
    server_dir: server_dir,
    electron: electron_de,
    command: StdindWrite,
    backup: World_BAckup,
    kill: bds_kill,
    get_version: bds_version_get,
    version_Download: DownloadBDS,
    date: date,
    detect: bds_detect
    
}