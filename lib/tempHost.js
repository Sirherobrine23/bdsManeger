const fetchSync = require("@the-bds-maneger/fetchsync");
const external_ip = require("../scripts/external_ip").external_ip;
const { GetTempHost } = require("./BdsSettings")
const os = require("os");
const MachinimeMAC = (()=>{
    const a = os.networkInterfaces();
    return Object.getOwnPropertyNames(a).map(inter => {
        inter = a[inter]
        if (inter[0].mac !== "00:00:00:00:00:00") {
            try {
                return {
                    MAC: inter[0].mac,
                    Interna_IP: {
                        ipv4: inter[0].address,
                        ipv6: inter[1].address,
                    }
                }
            } catch (err) {
                return {
                    MAC: inter[0].mac,
                    Interna_IP: {
                        ipv4: inter[0].address,
                        ipv6: null,
                    }
                }
            }
        }
    }).filter(a=>a)
})()

if (GetTempHost()){
    // Get HOST
    const BodyGet = JSON.stringify({
        mac: MachinimeMAC[0].MAC,
        ip: external_ip.ipv4,
    });
    console.log(BodyGet);
    const HostResponse = fetchSync("https://bds-core-back-end.vercel.app/Gethost", {
        method: "POST",
        mode: "cors",
        body: BodyGet
    }).json();
    console.log(HostResponse);
    global.BdsTempHost = HostResponse.user.host.host
    module.exports.host = HostResponse.user.host.host
    module.exports.Response = HostResponse
    
    // Delete Host
    process.on("exit", function () {
        const BodyDell = JSON.stringify({
            ID: HostResponse.user.ID
        });
        console.log(BodyDell);
        const deleted_host = fetchSync("https://bds-core-back-end.vercel.app/DeleteHost", {
            method: "POST",
            mode: "cors",
            body: BodyDell
        }).json();
        if (!(deleted_host.ok)) (deleted_host.text)
    })
} else module.exports.host = null