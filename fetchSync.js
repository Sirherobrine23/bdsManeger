const { execSync } = require("child_process");
const { tmpdir } = require("os");
const ce = require("./commandExist");
/**
 * make a request and receive its value, this locks up all the java work
 *
 * @param {string} url
 * @param {JSON} options
 * @return {*} 
 */
const FetchSync = function (url, options){
    url = decodeURI(url);
    var command = {
        command: null,
        shell: null
    };
    if (typeof options !== "object") options = {}
    if (process.platform === "linux" || process.platform === "android" || process.platform === "darwin"){
        if (ce("curl")) {
            command.command = `curl -sS "${url}"`
            command.shell = "/bin/sh"
        } else if (ce("wget")) {
            command.command = `wget -qO- "${url}"`
            command.shell = "/bin/sh"
        }
    } else if (process.platform === "win32") {
        if (ce("curl")) {
            command.command = `curl -sS "${url}"`
            command.shell = "C:\\Windows\\System32\\cmd.exe"
        } else {
            command.command = `(Invoke-WebRequest -URI "${url}").Content`;
            if (process.arch === "x64") command.shell = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
            else command.shell = "C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe";
        }
    }
    const ValueReturn = execSync(command.command.split(/\s+/).join(" "), {cwd: tmpdir(), shell: command.shell})
    return {
        text: function (){return ValueReturn.toString()},
        json: function(){return JSON.parse(ValueReturn.toString())}
    }
}

module.exports = FetchSync