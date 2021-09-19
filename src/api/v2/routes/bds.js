// Node Internal modules
const fs = require("fs");
const os = require("os");

// Bds Manager Core modules
const BdsCore = require("../../../../index");
const BdsSystemInfo = require("../../../../lib/BdsSystemInfo");
const BdsChecks = require("../../../UsersAndtokenChecks");

// Express
const express = require("express");
const app = express.Router();

// Routes
app.get("/info", ({res}) => {
    try {
        const BdsConfig = BdsCore.getBdsConfig();
        const Players = JSON.parse(fs.readFileSync(BdsCore.BdsSettigs.GetPaths("player"), "utf8"))[BdsConfig.server.platform];
        const Offline = Players.filter(player => player.Action === "disconnect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)));
        const Online = Players.filter(player => player.Action === "connect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player && Offline.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)) === -1)))
        const Info = {
            core: {
                version: BdsCore.package_json.version,
                Total_dependencies: Object.keys(BdsCore.package_json.dependencies).length + Object.keys(BdsCore.package_json.devDependencies).length,
            },
            server: {
                version: BdsConfig.server.versions[BdsConfig.server.platform],
                versions: BdsConfig.server.versions,
                players: {
                    online: Online.length,
                    offline: Offline.length,
                }
            },
            host: {
                System: process.platform,
                Arch: BdsCore.arch,
                Kernel: BdsSystemInfo.GetKernel(),
                Cpu_Model: os.cpus()[0].model || null,
            }
        }
        res.json(Info);
    } catch (error) {
        res.status(500).json({
            error: "Backend Error",
            message: `${error}`
        });
    }
});

// Download Server
app.get("/download_server", (req, res) => {
    const { Token = null, Version = "latest" } = req.query;

    // Check is Token is String
    if (!Token) return res.status(400).json({
        error: "Bad Request",
        message: "Token is required"
    });

    // Check Token
    if (!(BdsChecks.token_verify(Token))) return res.status(400).json({
        error: "Bad Request",
        message: "Token is invalid"
    });

    // Download Server
    BdsCore.download(Version, true).then(() => {
        res.json({
            message: "Server Downloaded"
        });
    }).catch(error => {
        res.status(500).json({
            error: "Backend Error",
            message: `${error}`
        });
    });
});

// Update/Set Server Settings
app.post("/save_settings", (req, res) => {
    const { Token = null,
        WorldName = "Bds Maneger",
        ServerDescription = "The Bds Maneger",
        DefaultGamemode = "creative",
        ServerDifficulty = "normal",
        MaxPlayer = "10",
        WorldSeed = "",
        AllowCommands = "true",
        RequireLogin = "true",
        EnableWhitelist = "false",
        port_v4 = "19132",
        port_v6 = "19133",
    } = req.body;

    // Check is Token is String
    if (!Token) return res.status(400).json({
        error: "Bad Request",
        message: "Token is required"
    });

    // Check Token
    if (!(BdsChecks.token_verify(Token))) return res.status(400).json({
        error: "Bad Request",
        message: "Token is invalid"
    });

    // Save Settings
    try {
        BdsCore.set_config({
            world: WorldName,
            description: ServerDescription,
            gamemode: DefaultGamemode,
            difficulty: ServerDifficulty,
            players: parseInt(MaxPlayer) || 10,
            commands: AllowCommands === "true",
            account: RequireLogin === "true",
            whitelist: EnableWhitelist === "true",
            port: parseInt(port_v4) || 19132,
            portv6: parseInt(port_v6) || 19133,
            seed: WorldSeed || "",
        });
        res.json({
            message: "Settings Saved",
            Config: {
                world: WorldName,
                description: ServerDescription,
                gamemode: DefaultGamemode,
                difficulty: ServerDifficulty,
                seed: WorldSeed || "",
                players: parseInt(MaxPlayer) || 10,
                commands: AllowCommands === "true",
                account: RequireLogin === "true",
                whitelist: EnableWhitelist === "true",
                port: parseInt(port_v4) || 19132,
                portv6: parseInt(port_v6) || 19133,
            }
        });
    } catch (error) {
        res.status(500).json({
            error: "Backend Error",
            message: `${error}`
        });
    }
});
app.get("/save_settings", ({res}) => res.status(404).json({
    error: "This route is POST, Error 404"
}));

// Exports the routes
module.exports = app;