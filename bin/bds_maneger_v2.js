#!/usr/bin/env node
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds-Manger-CLI";
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;

// External Modules
const cli_color = require("cli-color");
const serverline = require("serverline");
const inquirer = require("inquirer");

// Bin Args
const ProcessArgs = require("minimist")(process.argv.slice(2));

// Import Bds Core
const BdsCore = require("../index");
const BdsReq = require("../lib/Requests");
const BdsExtraInfo = require("../BdsManegerInfo.json");

// Async functiona
async function Runner() {
    // ESM Modules
    const ora = (await import("ora")).default;

    // Update Bds Core Platform
    if (ProcessArgs.platform || ProcessArgs.p) {
        const UpdatePla = ora("Updating Bds Platform").start();
        try {
            BdsCore.platform_update(ProcessArgs.platform || ProcessArgs.p);
            UpdatePla.succeed(`Now the platform is the ${ProcessArgs.platform || ProcessArgs.p}`);
        } catch (error) {
            UpdatePla.fail(`Unable to update platform to ${ProcessArgs.platform || ProcessArgs.p}`);
            process.exit(1);
        }
    }

    // Print Info about Bds Core and Platforms
    if (ProcessArgs.info || ProcessArgs.i) {
        const { valid_platform } = await (require("../lib/BdsSystemInfo"))();
        var checkothearch = "";
        if (process.platform === "linux" && BdsCore.arch !== "x64"){checkothearch = `qemu-x86_64-static is installed to emulate an x64 system: ${commandExits("qemu-x86_64-static")}\n`}
        if (process.platform === "android" && BdsCore.arch !== "x64"){checkothearch = `qemu-x86_64 is installed to emulate an x64 system: ${commandExits("qemu-x86_64")}\n`}
        const help = [
            `Bds Maneger Core And Bds Maneger CLI version: ${cli_color.magentaBright(BdsCore.package_json.version)}`,
            `System: ${cli_color.yellow(process.platform)}, architecture: ${cli_color.blue(BdsCore.arch)}`,
            checkothearch,
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
        console.log(cli_color.whiteBright(help.join("\n").replace(/true/gi, cli_color.greenBright("true")).replace(/false/gi, cli_color.redBright("false")).replace(/undefined/gi, cli_color.red("undefined"))));
        // End
        return;
    }

    // Download
    if (ProcessArgs.download || ProcessArgs.d) {
        const VersionList = Object.getOwnPropertyNames((await BdsReq.json(BdsExtraInfo.Fetchs.servers))[BdsCore.BdsSettigs.GetPlatform()]).map(version => ({
            name: `${BdsCore.BdsSettigs.GetPlatform()}: v${version}`,
            value: version,
        }))
        if ((ProcessArgs.download || ProcessArgs.d) === true || (ProcessArgs.download || ProcessArgs.d) === "latest") ProcessArgs.d = ProcessArgs.download = (await inquirer.prompt([
            {
                type: "list",
                name: "download",
                message: "Select the platform to download",
                choices: VersionList
            }
        ])).download;
        const oraDownload = ora(`Downloading ${BdsCore.BdsSettigs.GetPlatform()} on version ${ProcessArgs.d || ProcessArgs.download}`).start();
        try {
            const DownloadInfo = await BdsCore.download.v2(ProcessArgs.d || ProcessArgs.download, true);
            const DownloadSucess = ["Downloaded Successfully"];
            if (DownloadInfo.version) DownloadSucess.push(`Version: ${DownloadInfo.version}`);
            if (DownloadInfo.data) DownloadSucess.push(`Data: ${DownloadInfo.data}`);
            if (DownloadInfo.platform) DownloadSucess.push(`Bds Core Platform: ${DownloadInfo.platform}`);
            oraDownload.succeed(DownloadSucess.join(", "))
        } catch (error) {
            oraDownload.fail(error.message);
            process.exit(1);
        }
    }

    if (!(ProcessArgs.start || ProcessArgs.s)) return;

    // Start
    const BdsCoreStart = BdsCore.start();
    BdsCoreStart.log(data => console.log(cli_color.blueBright(data.replace(/\n$/gi, ""))));
    BdsCoreStart.exit(code => {
        console.log(cli_color.redBright(`Bds Core Exit with code ${code}, Uptimed: ${BdsCoreStart.uptime}`));
        process.exit(code);
    });
    serverline.init();
    serverline.setCompletion(["tp"]);
    serverline.setPrompt("Command > ");
    serverline.on("line", async function(line) {
        if (/^@/.test(line)) {
            console.log("🤪It's not working yet!");
            // const command = (await inquirer.prompt([
            //     {
            //         type: "list",
            //         name: "command",
            //         message: "Select the command to run",
            //         choices: ["tp", "stop", "restart", "update", "info", "download"]
            //     }
            // ])).command;
        } else BdsCoreStart.command(line);
    });
}
Runner();
