if (process.argv[0].includes('electron')){
    console.log('Electron')
} else {
    console.log('Use alguma pagina com electron')
    process.exit();
}
// This script server to forcefully kill old servers without being stopped before closing the application or having reloaded the page, an alternative and safer way is being sought.var
if (process.platform == 'win32'){
    if (require('os').release().includes('10.')){
        var home = process.env.USERPROFILE;
        var system = `windows`;
    } else {
        alert(`Alerta \"Utilize o Windows 10 OU Windows Server 2016\"`);
        require('electron').remote.app.quit();    
    }
} else if (process.platform == 'linux'){
    var home = process.env.HOME;
    var system = `linux`;
} else {
    alert(`Por Favor utilize uma sistema operacional (OS) compativel com o Minecraft Bedrock Server o ${process.platform} não é Suportdo`);
    require('electron').remote.app.quit();
}

function bds_kill(){
    var spawn = require('child_process').spawn;
    if (process.platform == 'win32'){
        var killbds = spawn('tasklist /fi "imagename eq bedrock_server.exe" | find /i "bedrock_server.exe" > nul & if not errorlevel 1 (taskkill /f /im "bedrock_server.exe" > nul && exit 0) else (exit 1)', {shell: true});  
    } else if (process.platform == 'linux'){
        // kill $(ps aux | grep '[p]ython csp_build.py' | awk '{print $2}')
        var killbds = spawn(`kill $(ps aux|grep -v 'grep'|grep 'bedrock_server'|awk '{print $2}')`, {shell: true});
    };    
    killbds.on('exit', function (code) {
        if (code == 0){
            localStorage.setItem('bds_status', 'stoped')
            killbds.stdin.end();
            window.location.reload(true);
        } else {
            localStorage.setItem('bds_status', 'stoped')
            killbds.stdin.end();
            window.location.reload(true);
        }
    });
}
function World_BAckup(){
    var bds_status_backup  = localStorage.getItem('bds_status');
    if (bds_status_backup == 'started'){
        alert('Pare o Servidor')
    } else {
    if (bds_status_backup == 'stoped'){
        
        if (process.platform == "win32"){
            var today = new Date();var dd = String(today.getDate()).padStart(2, '0');var mm = String(today.getMonth() + 1).padStart(2, '0');var yyyy = today.getFullYear();var hour = today.getHours();var minu = today.getMinutes();today = `Date_${yyyy}-${mm}-${dd}(Hour_${hour}-Minutes_${minu})`;
            var name = `${process.env.USERPROFILE}/Desktop/bds_backup_World_${today}.zip`
            var dir_zip = `${process.env.USERPROFILE}/bds_Server/worlds/`
        } else if (process.platform == 'linux'){
            var today = new Date();var dd = String(today.getDate()).padStart(2, '0');var mm = String(today.getMonth() + 1).padStart(2, '0');var yyyy = today.getFullYear();var hour = today.getHours();var minu = today.getMinutes();today = `Date_${yyyy}-${mm}-${dd} Hour_${hour}-Minutes_${minu}`;
            var name = `${process.env.HOME}/bds_backup_World_${today}.zip`
            var dir_zip = `${process.env.HOME}/bds_Server/worlds/`
        }; /* End Files name */
        /* Compress the folders */
        var AdmZip = require('adm-zip');
        var zip = new AdmZip();
        zip.addLocalFolder(dir_zip);/* var willSendthis = zip.toBuffer(); */
        zip.addZipComment(`Backup zip file in ${today}. \nBackup made to ${process.platform}, Free and open content for all\n\nSirherobrine23© By Bds Maneger.`)
        var zipEntries = zip.getEntries();
                zipEntries.forEach(function(zipEntry) {
                    console.log(zipEntry.entryName.toString());
                });
        zip.writeZip(name); /* Zip file destination */
        console.log('Backup Sucess')
        /* Compress the folders */
    };
}
};
/*function log_save() {
    const log_save_fs = require('fs')
    if (process.platform == 'win32'){
        var output_dir = `${process.env.USERPROFILE}`
    } else if (process.platform == 'linux'){
        var output_dir = `${process.env.HOME}`
    };
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = `${mm}-${dd}-${yyyy}`;
    const filename = `${output_dir}/${today}_Bds-log_by_Bds-Maneger.txt`
    var GetDivorTextarea = document.getElementById('LOG').tagName
    log_save_fs.writeFile(filename, `---- Start ----\n\n ${Log}\n\n---- End ----`, function (err) {
        if (err) throw err;
            console.log('Log Save in home dir')
    });
};*/
function Server_Start() {
    if (sessionStorage.getItem('S1')){
        alert('Reinicie o aplicativo')
    } else {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        today = `${mm}-${dd}-${yyyy}`;
        var fs = require('fs')
        let logConsoleStream = fs.createWriteStream(`${home}/Desktop/${today}_Bds_log.log`, {flags: 'a'});
        var exec = require('child_process').exec;
        if (process.platform == 'win32'){
            var bdsDIRpathexe = `cd ${process.env.USERPROFILE}/bds_Server/ && bedrock_server.exe`;
        } else if (process.platform == 'linux'){
            var bdsDIRpathexe = `cd ${process.env.HOME}/bds_Server/ && chmod 777 bedrock_server && LD_LIBRARY_PATH=${process.env.HOME}/bds_Server/.  ./bedrock_server`
        }
        var serverstated = exec(bdsDIRpathexe, {detached: false});
        localStorage.setItem('bds_status', 'started')
        serverstated.stdout.pipe(logConsoleStream);
        return serverstated
    }
    
};
function Server_Stop(){
    sessionStorage.setItem('S1', true)
    serverstated.stdin.write(`say voce\n`);
    for (let index = 1; index < 12; index++) {
        setTimeout(function timer() {
            if (index == '11'){
                serverstated.stdin.write('stop\n');
            } else {
                serverstated.stdin.write(`say Server is stop in ${index}s\n`);
                console.log(`Server is stop in ${index}s`);
            };
        }, index * 1000);
    };
};
function commandwrite(command) {
    serverstated.stdin.write(`${command}\n`);
};

function bds_version_get(type){
    var fs = require('fs')
    if (process.platform == 'linux'){
        var TMP = '/tmp/v.json'
    } else if (process.platform == 'win32') {
        var TMP = `${process.env.TMP}/v.json`
    }
    fetch('https://raw.githubusercontent.com/Sirherobrine23/Bds_Maneger-for-Windows/dev/Server.json').then(response => response.text()).then(rawOUT => {fs.writeFileSync(TMP, rawOUT);});
    var vers = JSON.parse(fs.readFileSync(TMP, 'utf8')).Versions
    for(index in vers){
        if (type == 'raw'){
            var out = `${vers[index]}\n ${out}`
        } else {
            var html = `${vers[index]}`
            var out = `${out}\n <option value=\"${html}\">${html}</option>`
            var html = ''
        };index++;
    };    
    return out.replace('undefined', '');
};

function DownloadBDS(ID){
    console.log("Iniciando o download");
    if (document.getElementById(ID).tagName == 'SELECT'){/* True */
        var Vdown = document.getElementById(ID).value
        localStorage.setItem('bds_server_version', Vdown)
        if (process.platform == 'win32'){
            var URLd = `https://minecraft.azureedge.net/bin-win/bedrock-server-${Vdown}.zip`;
        } else if (process.platform == 'linux'){
            var URLd = `https://minecraft.azureedge.net/bin-linux/bedrock-server-${Vdown}.zip`;
        }
        console.log(URLd, NAMEd)
        var NAMEd = `bedrock-server-${Vdown}.zip'`
        // 
        var exec = require('child_process').exec;
        if (process.platform == 'win32'){
            var downloadBDSchild = exec(`cd %TMP% && curl ${URLd} --output ${NAMEd}`);
        } else if (process.platform == 'linux'){
            var downloadBDSchild = exec(`cd /tmp && curl ${URLd} --output ${NAMEd}`);
        };
        downloadBDSchild.on('exit', function (code) {
            if (code == 0){
                console.log('download Sucess');
                if (process.platform == 'win32'){
                    var ZIP_FILE_PATH = `${process.env.TMP}/${NAMEd}`;
                    var ZIP_FILE_OUTPUT = `${process.env.USERPROFILE}/bds_Server`;
                } else if (process.platform = 'linux'){
                    var ZIP_FILE_PATH = `/tmp/${NAMEd}`;
                    var ZIP_FILE_OUTPUT = `${process.env.HOME}/bds_Server`;
                }
                // Unzip
                console.log('init extract');
                var AdmZip = require('adm-zip');
                var zip = new AdmZip(ZIP_FILE_PATH);
                var zipEntries = zip.getEntries();
                zipEntries.forEach(function(zipEntry) {
                    console.log(zipEntry.entryName.toString())
                });
                zip.extractAllTo(ZIP_FILE_OUTPUT, true);
                console.log('extract Sucess')
                // End Unzip
            } else {
                alert('Erro to download')
            }
        }); 
    } /* Select */ else {
        alert('Erro')
    };
};

// Module export
module.exports = {
    start: Server_Start,
    stop: Server_Stop,
    command: commandwrite,
    /*log: log_save,*/
    backup: World_BAckup,
    kill: bds_kill,
    get_version: bds_version_get,
    version_Download: DownloadBDS
}