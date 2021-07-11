const fetchSync = require("@the-bds-maneger/fetchsync");
const external_ip = require("../scripts/external_ip").external_ip;
const { GetTempHost } = require("./BdsSettings")
const machinime_mac = (()=>{
    const net = require("os").networkInterfaces();
    for (let interfac of Object.getOwnPropertyNames(net)){
        var mac = net[interfac][0].mac;
        if (!(mac.includes("00:00:00"))) return mac
    }
})();
if (GetTempHost()){
    const getHost = `${require("../extra.json").temp_host.url}/host/get/${machinime_mac}/${external_ip.ipv4}`;
    const TMPHost = fetchSync(getHost).json();
    global.BdsTempHost = TMPHost.host
    // export tmp url
    module.exports.tmphost = TMPHost
    process.on("exit", function () {
        const deleteHost = `${require("../extra.json").temp_host.url}/host/delete/${machinime_mac}/${global.BdsTempHost}`
        const deleted_host = fetchSync(deleteHost).json();
        if (!(deleted_host.ok)) (deleted_host.text)
    })
} else module.exports.tmphost = null