#!/usr/bin/env node
if (process.platform === "win32") process.title = "Bds Maneger CLI";else process.title = "Bds_Manger_CLI"
const readline = require("readline");
const bds = require("../../index");
const { valid_platform } = require("../../lib/BdsSystemInfo");
const { bds_dir, GetServerVersion, GetPlatform, UpdatePlatform, GetServerPaths, GetPaths } = require("../../lib/BdsSettings");
const commandExits = require("../../lib/commandExist");
const download = require("../src/Scripts/download");
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;
// Bds Maneger ArgV
const argv = require("minimist")(process.argv.slice(2));
if (Object.getOwnPropertyNames(argv).length <= 1) argv.help = true

// Options
const server = (argv.p || argv.platform), version = (argv.v || argv.version), SystemCheck = (argv.S || argv.system_info), bds_version = (argv.d || argv.server_download), start = (argv.s || argv.server_version), help = (argv.h || argv.help), kill = (argv.k || argv.kill), docker_runner = (argv.DOCKER_IMAGE)

// --------------------------
const Versions = GetServerVersion();

// Bds kill
if (kill) bds.kill();

// Set Bds Platform
if (server) UpdatePlatform(server);

function StartServer(){
    const { Servers } = require("../../lib/ServerURL");
    // Check Server Update
    if (Versions[GetPlatform()] !== null) {
        if (Versions[GetPlatform()] !== Servers.latest[GetPlatform()]) {
            const message = [
                `Hello, I have a little warning, There is a new version of ${GetPlatform()}, going from version ${GetServerVersion[GetPlatform()]} to ${Servers.latest[GetPlatform()]}`,
                "And we strongly recommend keeping the servers up to date, to maintain compatibility between game versions.",
                `At any time you can update using the options -p ${GetPlatform()} -d "${Servers.latest[GetPlatform()]}"`
            ]
            console.log(message.join("\n"))
        }
    } else if (Versions[GetPlatform()] === null) {
        console.log("Install Server");
        process.exit(1)
    }
    try {
        console.log("Send a \"@stop\" command to stop the server and exit\nUse CTRL + C to force exit\n");
        // Start Server
        const bds_server = bds.start();
        bds_server.log(echo)
        bds_server.exit(function (code){if (code === 3221225781) return open("https://docs.the-bds-maneger.org/Bds Maneger core/WindowsFixDll");console.log("leaving the server, status code: ", code);process.exit(code)});

        // CLI Commands
        const rl = readline.createInterface({input: process.stdin,output: process.stdout});
        rl.on("line", (input) => {if (input === "@stop") {rl.close(); bds_server.stop()} else bds_server.command(input)});
        rl.on("close", ()=>{console.log("CTRL + C closed readline, stopping server");bds_server.stop()})
        bds_server.exit(function(c){if (c !== 0) rl.close()})
        bds.api();
    } catch (err) {
        console.log(`Bds Maneger Start Server Error: \n******\n${err}`);
        process.exit(2)
    }
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
        "       --interactive       Install the server interactively",
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
        `Bds Maneger Core version: ${bds.package_json.version}`,
        `System: ${process.platform}, architecture: ${bds.arch}`,
        checkothearch,
        "**************************************************************",
        "* Bds Maneger dirs:",
        `*   - Config:                ${bds_dir}`,
        `*   - Players File:          ${GetPaths("player")}`,
        "*",
        "* Bds Servers dirs:",
        `*   - Bedrock Server:        ${GetServerPaths("bedrock")}`,
        `*   - Java Server:           ${GetServerPaths("java")}`,
        `*   - Pocketmine-MP Server:  ${GetServerPaths("pocketmine")}`,
        `*   - JSPrismarine Server:   ${GetServerPaths("jsprismarine")}`,
        "*",
        "**************************************************************",
        "* Servers currently available:",
        `*   - Bedrock:          ${valid_platform.bedrock}`,
        `*   - Java:             ${valid_platform.java}`,
        `*   - Pocketmine-MP:    ${valid_platform.pocketmine}`,
        `*   - JSPrismarine:     ${valid_platform.jsprismarine}`,
        "*",
        "**************************************************************"
    ];
    console.log(help.join("\n"))
    process.exit(0)
}

// Docker image
if (docker_runner) {
    console.log("Bds Maneger CLI, Docker image");
    process.env.BDS_DOCKER_IMAGE = true
    const { SERVER, WORLD_NAME, DESCRIPTION, GAMEMODE, DIFFICULTY, PLAYERS, ENABLE_COMMANDS, XBOX_ACCOUNT, TELEGRAM_TOKEN, SEED } = process.env
    
    // Telegram token save
    if (TELEGRAM_TOKEN) bds.telegram_token_save(TELEGRAM_TOKEN);
    
    // Change platform
    bds.change_platform(SERVER)
    
    // Save New config
    bds.set_config({
        world: WORLD_NAME,
        description: DESCRIPTION,
        gamemode: GAMEMODE,
        difficulty: DIFFICULTY,
        players: parseInt(PLAYERS),
        commands: (ENABLE_COMMANDS === "true"),
        account: JSON.parse(XBOX_ACCOUNT),
        whitelist: false,
        port: 19132,
        portv6: 19133,
        seed: (parseInt(SEED) || "")
    })
}

// Download server
if (bds_version){
    try {
        if (argv.interactive) {
            console.log(`Geting versions to ${GetPlatform()}`);
            const LoadVersion = require("../../lib/ServerURL").Servers[GetPlatform()]
            const Version = Object.getOwnPropertyNames(LoadVersion)
            // List Version
            for (let version in Version) console.log(`${version}: ${GetPlatform()} version ${Version[version]}`); // deepscan-disable-line FORIN_ARRAY
            const DownloadOptions = readline.createInterface({input: process.stdin,output: process.stdout});
            console.log("\nSelect Option");
            DownloadOptions.on("line", (input) => {
                download(Version[parseInt(input)], true, function(){
                    console.log("Installation was successful, so start the server with the -s option");
                    if (start) StartServer();
                    else process.exit(0)
                })
            });
        }
        else bds.download(bds_version, true, function(){
            if (start) StartServer();
        })
    }
    catch (error) {console.error(error);process.exit(165);}
}

// Start server
function echo(data = ""){
    data = data.split("\n").filter(data => {return (data !== "")})
    data.forEach(data => console.log(data))
}
if (start && !(server || version || SystemCheck || bds_version || help)) StartServer();
