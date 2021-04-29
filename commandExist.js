const { readdirSync } = require("fs");
const { resolve } = require("path");

function getBins() {
    const PATHs = process.env.PATH.split(/;?:/g);
    const bin = []
    for (let path of PATHs){
        for (let binS of readdirSync(resolve(path))) bin.push(binS)
    }
    return bin
}

function commdExist(command){
    let bin = getBins()
    for (let index of bin) if (index === command) return true
    return false
}

module.exports = commdExist
module.exports.sync = commdExist