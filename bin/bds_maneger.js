#!/usr/bin/env node
const readline = require("readline");
const cli_color = require("cli-color");
const BdsConfigAndInfo = require("../BdsManegerInfo.json");
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds-Manger-CLI";
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;

// Bds Maneger ArgV
const argv = require("minimist")(process.argv.slice(2));
if (Object.getOwnPropertyNames(argv).length <= 1) argv.help = true

const bds = require("../index");
const SystemInfo = require("../lib/BdsSystemInfo");
const { bds_dir, GetServerVersion, GetPlatform, UpdatePlatform, GetServerPaths, GetPaths } = require("../lib/BdsSettings");
const commandExits = require("../lib/commandExist");
const download = require("../src/BdsServersDownload");

// Options
const
    server = (argv.p || argv.platform),
    version = (argv.v || argv.version),
    SystemCheck = (argv.S || argv.system_info),
    bds_version = (argv.d || argv.download),
    start = (argv.s || argv.server_version),
    help = (argv.h || argv.help),
    kill = (argv.k || argv.kill);

// --------------------------
const Versions = GetServerVersion();

// Bds kill
if (kill) bds.kill();

// Set Bds Platform
if (server) UpdatePlatform(server);

// Start Server
async function StartServer(){
    const Servers = (await (await fetch(BdsConfigAndInfo.Fetchs.servers)).json());
    // Check Server Update
    if (Versions[GetPlatform()] !== null) {
        if (Versions[GetPlatform()] !== Servers.latest[GetPlatform()]) {
            const message = [
                `Hello, I have a little warning, There is a new version of ${GetPlatform()}, going from version ${GetServerVersion[GetPlatform()]} to ${Servers.latest[GetPlatform()]}`,
                "And we strongly recommend keeping the servers up to date, to maintain compatibility between game versions.",
                `At any time you can update using the options -p ${GetPlatform()} -d "${Servers.latest[GetPlatform()]}"`
            ]
            console.log(cli_color.yellow(message.join("\n")));
        }
    } else if (Versions[GetPlatform()] === null) {
        console.log(cli_color.red("Install Server"));
        process.exit(1)
    }
    try {
        console.log(cli_color.yellow("Send a \"@stop\" command to stop the server and exit\nUse CTRL + C to force exit"), "\n");
        // Start Server
        const bds_server = bds.start();
        bds_server.log(data => process.stdout.write(cli_color.cyan(data)));
        bds_server.exit(function (code){
            if (code === 3221225781 && process.platform === "win32") {
                console.log(cli_color.red("Open the url: https://docs.the-bds-maneger.org/Bds Maneger core/WindowsFixDll"));
                return open("https://docs.the-bds-maneger.org/Bds Maneger core/WindowsFixDll");
            }
            console.log(cli_color.red(`"leaving the server, status code: ${code}"`));
            process.exit(code);
        });

        // CLI Commands
        const rl = readline.createInterface({input: process.stdin,output: process.stdout});
        rl.on("line", (input) => {
            // Stop
            if (input.trim() === "@stop") {
                rl.close();
                bds_server.stop()
            }
            // Server input
            else bds_server.command(input);
        });
        rl.on("close", ()=>{
            console.log(cli_color.redBright("stopping server"));
            bds_server.stop();
        })
        bds_server.exit(function(c){
            if (c !== 0) rl.close();
        })
        bds.api();
    } catch (err) {
        console.log(cli_color.redBright(`Bds Maneger Start Server Error: \n******\n${err}`));
        process.exit(2)
    }
}
(async () => {
    // Bds Maneger CLI Help
    if (help) {
        let help = [
            "usage: bds_maneger [options]",
            "",
            "options:",
            "  -s  --start            Start Server",
            "  -k  --kill             Detect and kill bds servers",
            "  -p  --platform         Select server platform",
            "  -d  --download         server version to install, default \"latest\"",
            "       --interactive       Install the server interactively",
            "  -S  --system_info      System info and test",
            "  -h  --help             Print this list and exit.",
            "  -v  --version          Print the version and exit."
        ]
        console.log(cli_color.yellow(help.join("\n")));
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
        const { valid_platform } = await SystemInfo();
        var checkothearch = "";
        if (process.platform === "linux" && bds.arch !== "x64"){checkothearch = `qemu-x86_64-static is installed to emulate an x64 system: ${commandExits("qemu-x86_64-static")}\n`}
        if (process.platform === "android" && bds.arch !== "x64"){checkothearch = `qemu-x86_64 is installed to emulate an x64 system: ${commandExits("qemu-x86_64")}\n`}
        const help = [
            `Bds Maneger Core And Bds Maneger CLI version: ${cli_color.magentaBright(bds.package_json.version)}`,
            `System: ${cli_color.yellow(process.platform)}, architecture: ${cli_color.blue(bds.arch)}`,
            checkothearch,
            "**************************************************************",
            "* Bds Maneger dirs:",
            `*   - Config:                ${cli_color.yellowBright(bds_dir)}`,
            `*   - Players File:          ${cli_color.yellowBright(GetPaths("player"))}`,
            "*",
            "* Bds Servers dirs:",
            `*   - Bedrock Server:        ${cli_color.yellowBright(GetServerPaths("bedrock"))}`,
            `*   - Pocketmine-MP Server:  ${cli_color.yellowBright(GetServerPaths("pocketmine"))}`,
            `*   - Dragonfly:             ${cli_color.yellowBright(GetServerPaths("dragonfly"))}`,
            `*   - Java Server:           ${cli_color.yellowBright(GetServerPaths("java"))}`,
            `*   - Spigot Server:         ${cli_color.yellowBright(GetServerPaths("spigot"))}`,
            "*",
            "**************************************************************",
            "* Servers currently available:",
            `*   - Bedrock:          ${valid_platform.bedrock}`,
            `*   - Pocketmine-MP:    ${valid_platform.pocketmine}`,
            `*   - Dragonfly:        ${valid_platform.dragonfly}`,
            `*   - Java:             ${valid_platform.java}`,
            `*   - Spigot:           ${valid_platform.java}`,
            "*",
            "**************************************************************"
        ];
        console.log(
            cli_color.whiteBright(help.join("\n")
                .replace(/true/gi, cli_color.greenBright("true"))
                .replace(/false/gi, cli_color.redBright("false"))
                .replace(/undefined/gi, cli_color.red("undefined"))
            ));
        process.exit(0)
    }

    // Download server
    if (bds_version){
        (async () => {
            try {
                if (argv.interactive) {
                    const LoadVersion = (await (await fetch(BdsConfigAndInfo.Fetchs.servers)).json())[GetPlatform()]
                    const Version = Object.getOwnPropertyNames(LoadVersion)
                    
                    const StartQuestion = (Readline) => {
                        Readline.question("Select a version to download: ", input => {
                            if (Version[parseInt(input) - 1]) {
                                Readline.close();
                                download(Version[parseInt(input) - 1], true, function(){
                                    if (start) return StartServer();
                                    console.log("Installation was successful, so start the server with the -s option");
                                    process.exit(0);
                                })
                            } else {
                                console.log("Invalid Option");
                                StartQuestion(Readline);
                            }
                        });
                    }
        
                    console.log(`Selected platform: ${GetPlatform()}, Total available versions: ${Version.length}`);
                    console.log(`${cli_color.red("Option")}     ${cli_color.green("Version")}`);
        
                    for (let option in Version) console.log(`${cli_color.red(parseInt(option) + 1)}:   ${cli_color.green(Version[option])}`);
                    StartQuestion(readline.createInterface({input: process.stdin,output: process.stdout}));
                }
                else bds.download(bds_version, true, function(){
                    if (start) StartServer();
                })
            } catch (error) {console.error(error);process.exit(165);}
        })();
    }

    // Start server
    if (start && !(server || version || SystemCheck || bds_version || help)) StartServer();

})()