function bds_version_get(type) {
    var fs = require('fs')
    if (process.platform == 'linux') {
        var TMP = '/tmp/v.json'
    } else if (process.platform == 'win32') {
        var TMP = `${process.env.TMP}/v.json`
    }
    if (typeof fetch === "function") {
        let NULL = null
    } else {
        var fetch = require('node-fetch')
    }
    fetch('https://raw.githubusercontent.com/Sirherobrine23/Bds_Maneger-for-Windows/main/Server.json').then(response => response.text()).then(rawOUT => {
        fs.writeFileSync(TMP, rawOUT);
    });
    function Versions(){
        for (index in vers) {
            if (type == 'raw') {
                var out = `${vers[index]}\n ${out.replaceAll}`
            } else {
                var html = `${vers[index]}`
                var out = `${out}\n <option value=\"${html}\">${html}</option>`
                var html = ''
            };
            index++;
        };
        return out.replace('undefined', '');
    }
    if (require('fs').existsSync(TMP)){
        var vers = JSON.parse(fs.readFileSync(TMP, 'utf8')).Versions;
        return Versions();
    } else {
        return "Erro"
    };
};

fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json")
  .then(function (response) {
    return response.json();
  })
  .then(function (content) {
    require('bds_maneger_api').Storage().setItem('bds_latest', content.latest);
    require('bds_maneger_api').Storage().setItem('bds_latest', content.latest);
  })
  .catch(function (error) {
    console.log("Error: " + error);
  });
function resposta(){
    return require('bds_maneger_api').Storage().getItem('bds_latest');
}
setTimeout(() => {
    resposta()
}, 1000)

module.exports.bds_latest = require('bds_maneger_api').Storage().getItem('bds_latest');
module.exports.bds_version_get = bds_version_get