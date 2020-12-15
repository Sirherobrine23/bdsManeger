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

// module.exports = bds_version_get
module.exports = {
    bds_version_get: bds_version_get
}