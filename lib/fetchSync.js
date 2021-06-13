const { execSync } = require("child_process");
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
    const CommandExec = {
        command: "",
        body: [],
        headers: [],
        output: undefined
    }
    // Body
    if (options.body){
        if (CommandsAvaible.curl) {
            for (let _B of Object.getOwnPropertyNames(options.body)) {
                CommandExec.body.push(`${CommandOptions.curl.body} ${_B}="${options.body[_B]}"`)
            }
        }
    }
    // Header
    if (options.headers){
        if (CommandsAvaible.curl) {
            CommandExec.command = "curl"
            for (let _B of Object.getOwnPropertyNames(options.headers)) {
                CommandExec.body.push(`${CommandOptions.curl.headers} ${_B}="${options.headers[_B]}"`)
            }
        }
    }

    // Binary
    const tmpFile = join(tmpdir(), `${(Math.random() * 1000 * Math.random())}_FetchSyncTemp.tmp`)
    if (CommandsAvaible.wget) {
        CommandExec.command = "wget"
        if (binary) CommandExec.output = `${CommandOptions.wget.output} ${tmpFile}`; else CommandExec.output = " -qO-"
    } else if (CommandsAvaible.curl) {
        CommandExec.command = "curl -sS"
        if (binary) CommandExec.output = `${CommandOptions.curl.output} "${tmpFile}"`;
    }

    // Exec
    const command = `${CommandExec.command} '${url}' ${CommandExec.body.join(" ")} ${CommandExec.headers.join(" ")} ${CommandExec.output}`
    console.log(command);
    var Exec = execSync(command);
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