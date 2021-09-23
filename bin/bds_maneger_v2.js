#!/usr/bin/env node
if (process.platform === "win32") process.title = "Bds Maneger CLI"; else process.title = "Bds-Manger-CLI";
process.env.IS_BDS_CLI = process.env.IS_BIN_BDS = true;

// External Modules
const cli_color = require("cli-color");
const inquirer = require("inquirer");

// Bin Args
const ProcessArgs = require("minimist")(process.argv.slice(2));

// Import Bds Core
const BdsCore = require("../index");

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

    // Download
    if (ProcessArgs.download || ProcessArgs.d) {
        const oraDownload = ora("Downloading...").start();
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

    // Start
    const BdsCoreStart = BdsCore.start();
    BdsCoreStart.log(data => process.stdout.write(cli_color.blueBright(data)));
    BdsCoreStart.exit(code => {
        console.log(cli_color.redBright(`Bds Core Exit with code ${code}, Uptimed: ${BdsCoreStart.uptime}`));
        process.exit(code);
    });
    const BdsCliMenus = require("./bds_maneger/menus");
    const InfinitCommands = async () => {
        const CommandtoRun = (await inquirer.prompt([
            {
                type: "list",
                name: "commands",
                message: "Select a command",
                choices: [
                    "tp"
                ]
            }
        ])).commands;
        if (CommandtoRun === "tp") {
            BdsCliMenus.tp();
            return await InfinitCommands();
        } else {
            BdsCliMenus.Command();
            return await InfinitCommands();
        }
    }
    InfinitCommands();
}
Runner();