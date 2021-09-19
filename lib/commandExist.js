const { execSync } = require("child_process");
const { readdirSync, existsSync } = require("fs");

function commdExist(command){
    if (process.platform === "linux" || process.platform === "darwin" || process.platform === "android") {try {execSync(`command -v ${command}`);return true} catch (error) {return false}}
    else if (process.platform === "win32") {try {execSync(`where ${command} > nul 2> nul`);return true} catch (error) {return false}}
    else {
        var PATHs;
        const bin = []
        if (process.platform === "win32") PATHs = process.env.PATH.split(/;/g);else PATHs = process.env.PATH.split(/:/g);
        
        for (let path of PATHs)
        if (existsSync(path))
            for (let binS of readdirSync(path)) bin.push(binS);
        for (let index of bin) {
            if (process.platform === "linux") {if (index === command) return true}
            else if (process.platform === "win32") {
                if (!command.includes(".exe", ".cmd", ".bat", ".EXE", ".CMD", ".BAT")) {
                    for (let test of [".exe", ".cmd", ".bat", ".EXE", ".CMD", ".BAT"])
                    if (index === `${command}${test}`) return true;
                }
            }
        }
        return false
    }
}

module.exports = commdExist
module.exports.sync = commdExist
