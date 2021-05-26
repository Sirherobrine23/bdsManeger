#!/usr/bin/node --no-warnings
process.env.IS_BIN_BDS = true;
process.env.IS_BDS_CLI = true
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds_Manger_CLI"
const readline = require("readline");
const bds = require("../index");
const { bds_dir } = require("../bdsgetPaths");
const commandExits = require("../commandExist");

// Bds Maneger ArgV
const argv = require("minimist")(process.argv.slice(2));
if (Object.getOwnPropertyNames(argv).length <= 1) argv.help = true
const
server =  (argv.p || argv.platform ),
version = (argv.v || argv.version),
SystemCheck = (argv.S || argv.system_info),
bds_version = (argv.d || argv.server_download),
start = (argv.s || argv.server_version),
help = (argv.h || argv.help),
kill = (argv.k || argv.kill)

// Check Server Update
if (bds.bds_config.platform_version[bds.platform] !== null) if (bds.bds_config.platform_version[bds.platform] !== bds.SERVER_URLs.latest[bds.platform]) console.log(`${bds.platform} has an update available for ${bds.bds_config.platform_version[bds.platform]} to ${bds.SERVER_URLs.latest[bds.platform]}, if you want to update, use the option "-p ${bds.platform} -d" ${bds.SERVER_URLs.latest[bds.platform]} ""`)

// Bds kill
if (kill) bds.kill();

// Set Bds Platform
if (server) {
    if (server === "BEDROCK"||server === "bedrock") bds.change_platform("bedrock");
    else if (server === "POCKETMINE-MP" || server === "pocketmine" || server === "pocketmine" || server === "POCKETMINE") bds.change_platform("pocketmine");
    else if (server === "JAVA"||server === "java") bds.change_platform("java");
    else if (server === "JSPrismarine" || server === "JSPRISMARINE" || server === "jsprismarine") bds.platform_update("jsprismarine");
    else console.log("Add one of the valid platforms: bedrock, pocketmine, java, jsprismarine");
}

// Bds Maneger CLI Help
if (help) {
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
    const Info = [
        `Bds Maneger Core version: ${bds.package_json.version}`,
        "",
        "****************** Bds Maneger Core contributors ******************",
        "",
    ]
    for (let contri of bds.extra_json.contributors) {
        Info.push(`********* ${contri.name} *********`)
        if (contri.email) Info.push(`* ${contri.email}`)
        if (contri.url) Info.push(`* ${contri.url}`)
        Info.push("*")
        Info.push("*********")
    }
    console.log(Info.join("\n"));
    process.exit();
}

if (SystemCheck) {
    var checkothearch = "";
    if (process.platform === "linux" && bds.arch !== "x64"){checkothearch = `qemu-x86_64-static is installed to emulate an x64 system: ${commandExits("qemu-x86_64-static")}\n`}
    if (process.platform === "android" && bds.arch !== "x64"){checkothearch = `qemu-x86_64 is installed to emulate an x64 system: ${commandExits("qemu-x86_64")}\n`}
    const help = [
        `Bds Maneger core version: ${bds.package_json.version}`,
        `System: ${process.platform}, Arch: ${bds.arch}`,
        `Java installed: ${commandExits("java")}`,
        `NodeJS version: ${process.versions.node}, v8: ${process.versions.v8}`,
        `Bds Maneger dir: ${bds_dir}`,
        checkothearch,
        "**************************************************************",
        `* Server support for ${bds.arch} architecture:`,
        `*   - Bedrock:          ${bds.valid_platform.bedrock}`,
        `*   - Java:             ${bds.valid_platform.java}`,
        `*   - Pocketmine:       ${bds.valid_platform.pocketmine}`,
        `*   - JSPrismarine:     ${bds.valid_platform.jsprismarine}`,
        "*",
        "**************************************************************"
    ];
    console.log(help.join("\n"))
    process.exit(0)
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
    try {
        bds.api();
        console.log("Send a \"stop\" command to stop the server and exit\nUse CTRL + C to force exit\n");
        
        // Start Server
        const bds_server = bds.start();
        bds_server.log(function (data){
            if (data.slice(-1) === "\n") data = data.slice(0, -1);
            console.log(data);
        })
        bds_server.exit(function (code){
            console.log("leaving the server, status code: ", code)
            process.exit(code)
        });

        // CLI Commands
        const rl = readline.createInterface({input: process.stdin,output: process.stdout});
        rl.on("line", (input) => {
            if (input === "stop") {rl.close(); bds_server.stop()} else bds_server.command(input)
        });
    } catch (error) {
        bds.download("latest", true, function(status){
            if (status) console.log("Sucess Install"); else console.log("erro in install");
        })
    }
}
