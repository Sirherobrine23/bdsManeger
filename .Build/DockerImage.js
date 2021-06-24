const fetchSync = require("../lib/fetchSync")
const { writeFileSync } = require("fs");
const { exit } = require("process");
const { resolve } = require("path");
const { exec, execSync } = require("child_process");
const JSon_release = fetchSync("https://api.github.com/repos/Sirherobrine23/MSQ-files/releases").json()

writeFileSync("./Docker.js", JSON.stringify(JSon_release, null, 4))
const DockerLatestBin = [];
for (let _Check of JSon_release){
    if (DockerLatestBin.length >= 1) break;
    for (let _file of _Check.assets) {
        if (`DockerRunBuild_${process.platform}_${process.arch}` === _file.name) {
            DockerLatestBin.push(_Check);
            break
        }
    }
}
if (!(DockerLatestBin.length >= 1)) exit(1);
const bin = fetchSync(`https://github.com/Sirherobrine23/MSQ-files/releases/download/${DockerLatestBin[0].tag_name}/DockerRunBuild_${process.platform}_${process.arch}`, true);
const binPath = resolve(__dirname, "../Docker.exe")
bin.save(binPath)
if (process.platform !== "win32") execSync(`chmod 777 "${binPath}"`)
const exe = exec(binPath)
function Log(data = ""){
    data = data.split("\r").join("\n").split("\n").filter(_D => {return (_D !== "")})
    for (let _log of data) console.log(_log);
}
exe.stdout.on("data", d => Log(d))
exe.stderr.on("data", d => Log(d))
exe.on("exit", c => exit(c))