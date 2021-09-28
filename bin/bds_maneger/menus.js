// Import Node Modules
const fs = require("fs");

// Import external modules
const inquirer = require("inquirer");

// Bds Core
const { getBdsConfig } = require("../../index");
const { GetPaths } = require("../../lib/BdsSettings");

const GetPlayers = (Platform = getBdsConfig().server.platform) => [...JSON.parse(fs.readFileSync(GetPaths("player"), "utf8"))[Platform]];

async function TpMenu() {
    const { BdsRun } = require("../../src/BdsManegerServer");
    const playerList = GetPlayers().map(player => player.Player && player.Action === "connect" ? player.Player : null).filter(a => a);

    // Check if there are players online
    if (playerList.length > 0) {
        const Player = await inquirer.prompt([
            {
                type: "list",
                name: "player",
                message: "Select a player",
                choices: playerList
            }
        ]);

        // Ask X, Y and Z Cordinates
        const cords = await inquirer.prompt([
            {
                type: "input",
                name: "x",
                message: "X Cordinate",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return "Please enter a number";
                }
            },
            {
                type: "input",
                name: "y",
                message: "Y Cordinate",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return "Please enter a number";
                }
            },
            {
                type: "input",
                name: "z",
                message: "Z Cordinate",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return "Please enter a number";
                }
            }
        ]);
        return BdsRun.tp(Player.player, {
            x: parseInt(cords.x),
            y: parseInt(cords.y),
            z: parseInt(cords.z)
        });
    } else throw new Error("No players online");
}

async function Command() {
    const { BdsRun } = require("../../src/BdsManegerServer");
    const Command = await inquirer.prompt([
        {
            type: "input",
            name: "command",
            message: "Enter a command"
        }
    ]);
    return BdsRun.command(Command.command);
}

module.exports.Command = Command;
module.exports.TpMenu = TpMenu;