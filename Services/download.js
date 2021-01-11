const { error } = require('console');

module.exports.DownloadBDS = (Vdown) => {
    console.warn('Do not exit BDS Manager')
    const exec = require('child_process').exec
    if (require('../index').electron){
        LocalStorage.setItem('bds_server_version', Vdown);
    };
    if (process.platform == 'win32') {
        var URLd = `https://minecraft.azureedge.net/bin-win/bedrock-server-${Vdown}.zip`;
        var downloadBDSchild = exec(`cd %TMP% && curl ${URLd} --output ${NAMEd}`);
        var ZIP_FILE_PATH = `${process.env.TMP}/${NAMEd}`;
    } else if (process.platform == 'linux') {
        var URLd = `https://minecraft.azureedge.net/bin-linux/bedrock-server-${Vdown}.zip`;
        var downloadBDSchild = exec(`cd /tmp && curl ${URLd} --output ${NAMEd}`);
        var ZIP_FILE_PATH = `/tmp/${NAMEd}`;
    };
    var NAMEd = `bedrock-server-${Vdown}.zip`
    downloadBDSchild.on('exit', function (code) {
        if (code == 0) {
            if (require('fs').existsSync(`${require('../index').server_dir}/server.properties`)){
                var OLD_ = true
                var old = require('fs').readFileSync(`${require('../index').server_dir}/server.properties`, "utf-8");
            };
            console.log(`Download zip file success`)
            var ZIP_FILE_OUTPUT = `${require('../index').server_dir}`;
            var AdmZip = require('adm-zip');
            var zip = new AdmZip(ZIP_FILE_PATH);
            zip.extractAllTo(ZIP_FILE_OUTPUT, true);
            if (OLD_){require('fs').writeFileSync(`${require('../index').server_dir}/server.properties`, old)};
            console.log('extract Sucess'); // End Unzip
        } else {
            throw new error(`Could not download`);
        }
    });
    return 'Complete'
};