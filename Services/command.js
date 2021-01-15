module.exports.command = (command) => {
    const fs = require("fs")
    const bds = require("../index")
    if (typeof bds_server_string === "undefined") {
        return "Start Server!";
    } else {
        if (command == undefined) {
            console.error("command?")
        } else {
            const old = fs.readFileSync(bds.log_file, "utf8");
            bds_server_string.stdin.write(`${command}\n`);
            for (let index = 0; index < 1000; index++) {
                var out = fs.readFileSync(bds.log_file, "utf8")
                if (!(old == out)){
                    var log = fs.readFileSync(bds.log_file, "utf8").replace(old, "");
                    global.Log_out = log;
                    break
                } else {
                    index++
                }
            }
            return log
        } /*Command Send*/
    } /*child_process*/
};