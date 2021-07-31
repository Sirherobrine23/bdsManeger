const fetchSync = require("@the-bds-maneger/fetchsync");
const { external_ip, Interfaces } = require("../src/external_ip");
const { GetTempHost } = require("./BdsSettings")

if (GetTempHost()){
    // Get HOST
    const HostResponse = fetchSync("https://bds-core-back-end.vercel.app/Gethost", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({
            mac: Interfaces[0].MAC,
            ip: external_ip.ipv4,
        }),
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    global.BdsTempHost = HostResponse.user.host.host
    module.exports.host = HostResponse.user.host.host
    module.exports.Response = HostResponse

    console.log(`Bds Maneger Core Temp Host ID: ${HostResponse.user.ID}`)

    // Delete Host
    process.on("exit", function () {
        const deleted_host = fetchSync("https://bds-core-back-end.vercel.app/DeleteHost", {
            method: "post",
            body: JSON.stringify({
                "ID": HostResponse.user.ID
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).json()
        if (deleted_host.error) console.log(deleted_host.error)
    })
} else module.exports.host = null