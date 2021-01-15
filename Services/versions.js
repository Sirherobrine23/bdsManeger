module.exports.bds_version_get = (type) => {
    var Storage = localStorage
    var vers = JSON.parse(Storage.getItem("bds_versions")).Versions;
    for (index in vers) {
        if (type == "raw") {
            var out = `${vers[index]}\n ${out}`
        } else {
            var html = `${vers[index]}`
            var out = `${out}\n <option value=\"${html}\">${html}</option>`
            var html = ""
        };
        index++;
    };
    return out.replaceAll(undefined, "");
};
module.exports.bds_latest = () => {
    const Storage = localStorage
    setTimeout(() => {
        var NULL = null
    }, 1000)
    return Storage.getItem("bds_latest");
};