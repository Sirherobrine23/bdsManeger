const { join } = require("path");
const fs = require("fs");
const { bds_config, package_json } = require("./index")
const { tmp_dir } = require("./bdsgetPaths");
const infolog = join(tmp_dir, "bdsManegerLog.log")

const oldStdout = console.log;
const logS = (...messages) => {
    oldStdout.apply(console, messages);
    fs.appendFileSync(infolog, messages.join("\n"));
}
global.console.log = logS;

const oldStderr = console.error;
const errorS = (...messages) => {
    oldStderr.apply(console, messages);
    fs.appendFileSync(infolog, messages.join("\n"));
    sendLogToTelemetry()
}
global.console.error = errorS;

const oldinfo = console.info;
const infoS = (...messages) => {
    oldinfo.apply(console, messages);
    fs.appendFileSync(infolog, messages.join("\n"));
    sendLogToTelemetry()
}
global.console.info = infoS;

const oldwarn = console.warn;
const warnS = (...messages) => {
    oldwarn.apply(console, messages);
    fs.appendFileSync(infolog, messages.join("\n"));
    sendLogToTelemetry()
}
global.console.warn = warnS;

function sendLogToTelemetry(){
    const body = {
        text: fs.readFileSync(infolog, "utf8")
    };
    fs.writeFileSync(infolog, "");
    const telemetryUrl = `${package_json.telemetry_url[0]}/id/${bds_config.TelemetryID}/error`;
    fetch(telemetryUrl, {method: "POST", mode: "cors", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)})
}

for (let interruptSignal of ["exit", "SIGQUIT", "SIGTERM"]){
    process.on(interruptSignal, function (){
        sendLogToTelemetry()
    })
}

module.exports.infoFile = infolog;