function DownloadBDS(Vdown) {
    console.log("Iniciando o download");
    // var Vdown = document.getElementById(ID).value
    if (require('bds_maneger_api').electron){
        require('bds_maneger_api').Storage().setItem('bds_server_version', Vdown)
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
    } else if (process.platform == 'linux') {
        var downloadBDSchild = exec(`cd /tmp && curl ${URLd} --output ${NAMEd}`);
    };
    downloadBDSchild.on('exit', function (code) {
        if (code == 0) {
            console.log('download Sucess');
            if (require('fs').existsSync(`${require('bds_maneger_api').server_dir}/server.properties`)){
                var OLD_ = true
                var old = require('fs').readFileSync(`${require('bds_maneger_api').server_dir}/server.properties`, "utf-8");
            }
            
            if (process.platform == 'win32') {
                var ZIP_FILE_PATH = `${process.env.TMP}/${NAMEd}`;
                require('child_process').execSync(`mklink /J ${require('bds_maneger_api').home.replaceAll('/', '\\')}\\Desktop\\Bds_server ${require('bds_maneger_api').server_dir.replaceAll('/', '\\')}`).toString()
            } else if (process.platform = 'linux') {
                var ZIP_FILE_PATH = `/tmp/${NAMEd}`;
                require('child_process').execSync(`ln -s ${require('bds_maneger_api').server_dir} ~/Desktop/Bds`)
            };
            var ZIP_FILE_OUTPUT = `${require('bds_maneger_api').server_dir}`;
            console.log('init extract'); // Unzip
            var AdmZip = require('adm-zip');
            var zip = new AdmZip(ZIP_FILE_PATH);
            zip.extractAllTo(ZIP_FILE_OUTPUT, true);
            console.log('extract Sucess'); // End Unzip
            if (OLD_){require('fs').writeFileSync(`${require('bds_maneger_api').server_dir}/server.properties`, old)};
            return 'Sucess'
        } /*Erro download*/
        else {
            alert('Erro to download');
            return 'Erro 1'
        }
    });
};
module.exports = {
    DownloadBDS: DownloadBDS
}