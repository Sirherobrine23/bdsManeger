#!/usr/bin/env node
"use strict";
process.env.IS_BIN_BDS = true;process.title = "Bds Maneger CLI";
const bds = require("../index")
const readline = require("readline");
var argv = require("minimist")(process.argv.slice(2));

if (Object.getOwnPropertyNames(argv).length === 1 || Object.getOwnPropertyNames(argv).length === 0) argv.help = true
var server =  (argv.p || argv.platform );
var version = (argv.v || argv.version);
var SystemCheck = (argv.S || argv.system_info);
var bds_version = (argv.d || argv.server_download);
var start = (argv.s || argv.server_version);

// Bds Maneger CLI Help
if (argv.h || argv.help) {
    let help = [
        "usage: bds_maneger [options]",
        "",
        "options:",
        "  -s  --start            Start Server",
        "  -k  --kill             Detect and kill bds servers",
        "  -p  --platform         Select server platform",
        "  -d  --server_download  server version to install, default \"latest\"",
        "  -S  --system_info      System info and test",
        "  -h  --help             Print this list and exit.",
        "  -v  --version          Print the version and exit."
    ]
    console.log(help.join("\n"));
    process.exit();
}

// Get Bds Core Version
if (version) {
    console.info("Bds Maneger core with version " + bds.package_json.version);
    process.exit();
}

if (SystemCheck) {
    const commandExits = require("../commandExist")
    const help = [
        `Bds Maneger core version: ${bds.package_json.version}`,
        `System: ${process.platform}, Arch: ${bds.arch}`,
        "Bds Maneger core Platforms:",
        `   - Bedrock:        ${bds.valid_platform.bedrock}`,
        `   - Java:           ${bds.valid_platform.java}`,
        `   - Pocketmine:     ${bds.valid_platform.pocketmine}`,
        `   - JSPrismarine:   ${bds.valid_platform.jsprismarine}`,
        `NodeJS version: ${process.versions.node}, v8: ${process.versions.v8}`,
        `Java installed: ${commandExits("java")}`,
        `cURL installed: ${commandExits("curl")}`,
        `wget installed: ${commandExits("wget")}`
    ]
    if ((process.platform === "linux" || process.platform === "darwin") && bds.arch !== "x64") help.push(`qemu-user-static insttaled: ${commandExits("qemu-x86_64-static")}`)
    console.log(help.join("\n"))
    process.exit(0)
}

// Bds kill
if (argv.k || argv.kill ) bds.kill();

// Set Bds Platform
if (server) {
    if (server === "BEDROCK"||server === "bedrock") bds.change_platform("bedrock");
    else if (server === "POCKETMINE-MP" || server === "pocketmine" || server === "pocketmine" || server === "POCKETMINE") bds.change_platform("pocketmine");
    else if (server === "JAVA"||server === "java") bds.change_platform("java");
    else if (server === "JSPrismarine" || server === "JSPRISMARINE" || server === "jsprismarine") bds.platform_update("jsprismarine");
    else console.log("Add one of the valid platforms: bedrock, pocketmine, java, jsprismarine");
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
}

// Start server
if (start) {
    console.log("Send a \"stop\" command to stop the server and exit\nUse CTRL + C to force exit\n\n");
    const bds_server = bds.start();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    bds_server.stdout.on("data", data => {if (data.slice(-1) === "\n") data = data.slice(0, -1);console.log(data);})
    bds_server.on("exit", function (code){
        console.log("leaving the server, status code: ", code)
        process.exit(code)
    })
    bds.api();
    rl.on("line", (input) => {
        if (input === "stop") {rl.close();console.log("\n************ ------------ Going out ------------ ************\n");}
        bds.command(input)
    });
}