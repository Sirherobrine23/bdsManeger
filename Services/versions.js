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

// module.exports = bds_version_get
module.exports = {
    bds_version_get: bds_version_get
}