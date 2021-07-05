const { execSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const { tmpdir } = require("os");
const { join, resolve } = require("path");
const CommandExists = require("./commandExist");
/**
 * make a request and receive its value, this locks up all the java work
 *
 * @param {string} url
 * @param {JSON} options
 * @return {*} 
 */

const CommandsAvaible = {
    "node": CommandExists("node"),
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
    options = {}
){
    if (CommandsAvaible.node) {
        const NdFetch = execSync(`node ${resolve(__dirname, "fetch/fetch.js")}`, {
            env: {
                ...process.env,
                URL_REQUEST: url,
                TYPE_REQUEST: binary,
                REQUEST_OPTIONS: JSON.stringify(options)
            }
        })
        return {
            json: function(){return JSON.parse(NdFetch.toString("utf8"))},
            text: function(){return NdFetch.toString("utf8")},
            Buffer: function(){return Buffer.from(NdFetch)},
            save: function(path = resolve(tmpdir(), `${Math.random()}.tmp`)){writeFileSync(path, Buffer.from(NdFetch), "binary");return path}
        }
    } else {
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
            argv.push("-sL")
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
}

module.exports = FetchSync