if (typeof fetch === "undefined"){
    global.fetch = require("node-fetch")
}

fetch("https://ipecho.net/plain").then(res => {if (res.ok) return res;else throw new Error(res);}).then(response => response.text()).then((response) => {
    module.exports.ip = response;
    module.exports.external_ip = response;
}).catch(function (err){console.error(err)});

const interfaces = require("os").networkInterfaces();
const keys = Object.getOwnPropertyNames(require("os").networkInterfaces());

const internal_ip = []

for (let index of keys){
    const inter = interfaces[index]
    for (let ind in inter){
        if (inter[ind].address.includes("::")) internal_ip.push(`[${inter[ind].address}]`)
        else internal_ip.push(inter[ind].address)
    }
}

module.exports.internal_ip = internal_ip