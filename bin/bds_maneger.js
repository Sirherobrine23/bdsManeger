#!/usr/bin/env node
"use strict";
process.env.IS_BIN_BDS = true;process.title = "Bds Maneger CLI";
const bds = require("../index")
const readline = require("readline");
var argv = require("minimist")(process.argv.slice(2));

var server =  (argv.p || argv.platform );
var version = (argv.v || argv.version);
var bds_version = (argv.V || argv.server_version);
var start = (argv.s || argv.server_version);

// Bds Maneger CLI Help
if (argv.h || argv.help) {
    console.log([
        "usage: bds_maneger [options]",
        "",
        "options:",
        "  -s --start           Start Server",
        "  -k --kill            Detect and kill bds servers",
        "  -p --platform        Select server platform",
        "  -V --server_version  server version to install, default \"latest\"",
        "  -h --help            Print this list and exit.",
        "  -v --version         Print the version and exit."
    ].join("\n"));
    process.exit();
}

// Get Bds Core Version
if (version) {
    console.info("Bds Maneger core with version " + bds.package_json.version);
    process.exit();
}

if (argv.k || argv.kill ) bds.kill();

// Set Bds Platform
if (server || server !== "") {
    if (server === "BEDROCK"||server === "bedrock") bds.change_platform("bedrock");
    else if (server === "POCKETMINE-MP" || server === "pocketmine" || server === "pocketmine" || server === "POCKETMINE") bds.change_platform("pocketmine");
    else if (server === "JAVA"||server === "java") bds.change_platform("java");
    else console.warn("Invalid platform, supported platforms are bedrock, java and pocketmine")
}

// Download server
if (bds_version){
    try {
        process.env.BDS_DOCKER_IMAGE = true
        bds.download(bds_version, true)
    } catch (error) {
        console.error(error)
        process.exit(165)
    }
} else {
    if (start) {
        console.info("Send a \"stop\" command to stop the server and exit");
        console.info("Use CTRL + C to force exit");
        const bds_server = bds.start();
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        bds_server.stdout.on("data", data => {if (data.slice(-1) === "\n") data = data.slice(0, -1);console.log(data);})
        bds_server.on("exit", function (code){
            console.log("leaving the server, status code: " ,code)
            process.exit(code)
        })
        bds.api();
        rl.on("line", (input) => {
            if (input === "stop") {rl.close();console.log("\n************ ------------ Going out ------------ ************\n");}
            bds.command(input)
        });
    } else {console.log("Start with bds-maneger -s");process.exit(1)}
}