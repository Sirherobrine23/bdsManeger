const { readdirSync, existsSync } = require("fs");
function getBins() {
    var PATHs;
    if (process.platform === "win32") PATHs = process.env.PATH.split(/;/g);
    else PATHs = process.env.PATH.split(/:/g);
    const bin = []
    for (let path of PATHs){
        if (existsSync(path))
            for (let binS of readdirSync(path)) {
                bin.push(binS)
            }
    }
    return bin
}

function commdExist(command){
    let bin = getBins()
    for (let index of bin) {
        if (index === command) return true;
        else if (process.platform === "win32" && !command.includes(".exe")) {if (index === command+".exe") return true;}
    }
    return false
}

module.exports = commdExist
module.exports.sync = commdExist