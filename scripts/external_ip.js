if (typeof fetch === "undefined"){
    global.fetch = require("node-fetch")
}

fetch("https://ipecho.net/plain").then(response => response.text()).then(function (response) {module.exports.ip = response;}).catch(function (err){console.error(err)});

const interfaces = require("os").networkInterfaces(),
    keys = Object.getOwnPropertyNames(require("os").networkInterfaces())

const internal_ip = []

for (let index in keys){
    const inter = interfaces[keys[index]]
    for (let ind in inter){
        if (inter[ind].address.includes("::")) internal_ip.push(`[${inter[ind].address}]`)
        else internal_ip.push(inter[ind].address)
    }
}

module.exports.internal_ip = internal_ip