const { execSync, execFileSync, spawnSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const CommandExists = require("./commandExist");
/**
 * make a request and receive its value, this locks up all the java work
 *
 * @param {string} url
 * @param {JSON} options
 * @return {*} 
 */

const CommandsAvaible = {
    "curl": CommandExists("curl"),
    "wget": CommandExists("wget"),
}

const CommandOptions = {
    wget: {
        method: {
            GET: {
                arg: ""
            },
            POST: {
                arg: ""
            },
            PUT: {
                arg: ""
            },
            DELETE: {
                arg: ""
            }
        },
        headers: "",
        body: "",
        output: "-O"
    },
    curl: {
        method: {
            GET: {
                arg: "-X GET"
            },
            POST: {
                arg: "-X POST"
            },
            PUT: {
                arg: "-X PUT"
            },
            DELETE: {
                arg: "-X DELETE"
            }
        },
        headers: "-H",
        body: "-F",
        output: "--output"
    }
}
function FetchSync(
    url = "https://google.com",
    binary = false,
    options = {
        body: {},
        headers: {},
        method: ""
    }
){
    // Decode URL
    url = decodeURI(url);
    const argv = [`"${url}"`]
    var CommandExec = ""
    // Body
    if (options.body){
        if (CommandsAvaible.curl) {
            for (let _B of Object.getOwnPropertyNames(options.body)) {
                argv.push(`${CommandOptions.curl.body} ${_B}="${options.body[_B]}"`)
            }
        }
    }
    // Header
    if (options.headers){
        if (CommandsAvaible.curl) {
            CommandExec = "curl"
            for (let _B of Object.getOwnPropertyNames(options.headers)) {
                argv.push(`${CommandOptions.curl.headers} ${_B}="${options.headers[_B]}"`)
            }
        }
    }

    // Binary
    const tmpFile = join(tmpdir(), `${(Math.random() * 1000 * Math.random())}_FetchSyncTemp.tmp`)
    if (CommandsAvaible.wget) {
        CommandExec = "wget"
        if (binary) argv.push(`${CommandOptions.wget.output} ${tmpFile}`); else argv.push(" -qO-")
    } else if (CommandsAvaible.curl) {
        if (process.platform === "win32") CommandExec = "curl.exe";else CommandExec = "curl"
        argv.push("-s")
        if (binary) argv.push(`${CommandOptions.curl.output} "${tmpFile}"`);
    }

    // Exec
    var Exec = execSync(`${CommandExec} ${argv.join(" ")}`);
    if (binary) {
        const SavedBuffer = Buffer.from(readFileSync(tmpFile))
        return {
            Buffer: SavedBuffer,
            save: function(path = tmpFile){writeFileSync(path, SavedBuffer, "binary");return path}
        }
    } else {
        return {
            Buffer: Exec,
            text: function (){return Exec.toString()},
            json: function(){return JSON.parse(Exec.toString())}
        }
    }
}

module.exports = FetchSync