module.exports.bds_version_get = (type) => {
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
    var bds_maneger = require('../index').Storage
    fetch('https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json').then(response => response.text()).then(rawOUT => {
        // fs.writeFileSync(TMP, rawOUT);
        bds_maneger().setItem('bds_versions', rawOUT);
        bds_maneger().setItem('bds_versions', rawOUT);
    });
    var vers = JSON.parse(bds_maneger().getItem('bds_versions')).Versions;
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
    return out.replaceAll(undefined, '');
};
module.exports.bds_latest = () => {
    var bds_maneger = require('../index').Storage
    if (typeof fetch === "function") {
        let NULL = null
    } else {
        var fetch = require('node-fetch')
    }
    fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json").then(function (response) {return response.json();}).then(function (content) {
        bds_maneger().setItem('bds_latest', content.latest);
        bds_maneger().setItem('bds_latest', content.latest);
    });
    setTimeout(() => {
        var NULL = null
    }, 1000)
    var result = require('../index').Storage().getItem('bds_latest');
    return result
}

//  = bds_latest
// = bds_version_get