function DownloadBDS(Vdown) {
    console.log("Iniciando o download");
    // var Vdown = document.getElementById(ID).value
    if (require('../index').electron){
        require('../index').Storage().setItem('bds_server_version', Vdown)
    }
    if (process.platform == 'win32') {
        var URLd = `https://minecraft.azureedge.net/bin-win/bedrock-server-${Vdown}.zip`;
    } else if (process.platform == 'linux') {
        var URLd = `https://minecraft.azureedge.net/bin-linux/bedrock-server-${Vdown}.zip`;
    }
    console.log(URLd, NAMEd)
    var NAMEd = `bedrock-server-${Vdown}.zip`
    // 
    var exec = require('child_process').exec;
    if (process.platform == 'win32') {
        var downloadBDSchild = exec(`cd %TMP% && curl ${URLd} --output ${NAMEd}`);
        var ZIP_FILE_PATH = `${process.env.TMP}/${NAMEd}`;
    } else if (process.platform == 'linux') {
        var downloadBDSchild = exec(`cd /tmp && curl ${URLd} --output ${NAMEd}`);
        var ZIP_FILE_PATH = `/tmp/${NAMEd}`;
    };
    downloadBDSchild.on('exit', function (code) {
        if (code == 0) {
            console.log('download Sucess');
            if (require('fs').existsSync(`${require('../index').server_dir}/server.properties`)){
                var OLD_ = true
                var old = require('fs').readFileSync(`${require('../index').server_dir}/server.properties`, "utf-8");
            };
            var ZIP_FILE_OUTPUT = `${require('../index').server_dir}`;
            console.log('init extract'); // Unzip
            var AdmZip = require('adm-zip');
            var zip = new AdmZip(ZIP_FILE_PATH);
            zip.extractAllTo(ZIP_FILE_OUTPUT, true);
            console.log('extract Sucess'); // End Unzip
            if (OLD_){require('fs').writeFileSync(`${require('../index').server_dir}/server.properties`, old)};
        }
    });
    return true
};
module.exports = {
    DownloadBDS: DownloadBDS
}