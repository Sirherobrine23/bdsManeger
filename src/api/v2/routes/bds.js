// Node Internal modules
const fs = require("fs");
const os = require("os");

// Bds Manager Core modules
const BdsCore = require("../../../../index");
const BdsSystemInfo = require("../../../../lib/BdsSystemInfo");
const BdsChecks = require("../../../UsersAndtokenChecks");
const BdsSettings = require("../../../../lib/BdsSettings");

// Express
const express = require("express");
const { get_whitelist } = require("../../../ServerSettings");
const app = express.Router();

// Routes
app.get("/info", ({res}) => {
    try {
        const BdsConfig = BdsCore.getBdsConfig();
        const Players = JSON.parse(fs.readFileSync(BdsCore.BdsSettigs.GetPaths("player"), "utf8"))[BdsSettings.GetPlatform()];
        const Offline = Players.filter(player => player.Action === "disconnect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)));
        const Online = Players.filter(player => player.Action === "connect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player && Offline.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)) === -1)))
        const Info = {
            core: {
                version: BdsCore.package_json.version,
                Total_dependencies: Object.keys(BdsCore.package_json.dependencies).length + Object.keys(BdsCore.package_json.devDependencies).length,
            },
            server: {
                version: BdsConfig.server.versions[BdsSettings.GetPlatform()],
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
                Cpu_Model: (os.cpus()[0] || {}).model || null,
                IsDocker: false,
                IsNpx: false,
                IsCLI: false,
            }
        }
        if (process.env.BDS_DOCKER_IMAGE) Info.host.IsDocker = true;
        if (process.env.npm_lifecycle_event === "npx") Info.host.IsNpx = true;
        if (process.env.IS_BDS_CLI) Info.host.IsCLI = true;
        res.json(Info);
    } catch (error) {
        res.status(500).json({
            error: "Backend Error",
            message: `${error}`
        });
    }
});

// Server Info
app.get("/info/server", ({res}) => {
    let ServerRunner = require("../../../BdsManegerServer").BdsRun;
    if (!ServerRunner)ServerRunner = {};
    try {
        const BdsConfig = BdsCore.getBdsConfig();
        const Players = JSON.parse(fs.readFileSync(BdsCore.BdsSettigs.GetPaths("player"), "utf8"))[BdsSettings.GetPlatform()];
        const Offline = Players.filter(player => player.Action === "disconnect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)));
        const Online = Players.filter(player => player.Action === "connect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player && Offline.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)) === -1)))
        const Info = {
            version: BdsConfig.server.versions[BdsSettings.GetPlatform()],
            Platform: BdsSettings.GetPlatform(),
            players: {
                online: Online.length,
                offline: Offline.length,
            },
            Config: BdsCore.get_config(),
            Process: {
                PID: ServerRunner.pid || 0,
                Uptime: ServerRunner.uptime || 0,
                StartTime: ServerRunner.StartTime || NaN,
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

// Whitelist
app.get("/info/server/whitelist", (req, res) => {
    const ServerConfig = BdsCore.get_config();
    if (ServerConfig.whitelist) {
        const { Token = null , Action = null } = req.query;
        const WgiteList = get_whitelist();
        if (Action) {
            if (Action === "add") {
                if (WgiteList.findIndex(WL => WL.Token === Token) === -1) {
                    WgiteList.push({
                        Token: Token,
                        Time: Date.now()
                    });
                    fs.writeFileSync(BdsCore.BdsSettigs.GetPaths("whitelist"), JSON.stringify(WgiteList));
                    res.json({
                        success: true,
                        message: "Whitelist Added"
                    });
                } else {
                    res.json({
                        success: false,
                        message: "Whitelist Already Exist"
                    });
                }
            } else if (Action === "remove") {
                if (WgiteList.findIndex(WL => WL.Token === Token) !== -1) {
                    WgiteList.splice(WgiteList.findIndex(WL => WL.Token === Token), 1);
                    fs.writeFileSync(BdsCore.BdsSettigs.GetPaths("whitelist"), JSON.stringify(WgiteList));
                    res.json({
                        success: true,
                        message: "Whitelist Removed"
                    });
                } else {
                    res.json({
                        success: false,
                        message: "Whitelist Not Found"
                    });
                }
            } else {
                res.json({
                    success: false,
                    message: "Invalid Action"
                });
            }
        } else {
            res.json(WgiteList)
        }
    } else {
        res.status(400).json({
            error: "Whitelist Not Enabled"
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

// Bds Maneger Bridge Communication
app.get("/bridge", (req, res) => {
    const ServerHost = require("../../../BdsNetwork").host || req.headers.host.replace(/^(.*?):\d+$/, (match, p1) => p1) || require("../../../BdsNetwork").externalIP.ipv4;
    const ServerConfig = BdsCore.get_config();
    res.json({
        host: ServerHost,
        port: ServerConfig.portv4,
    });
});

// Exports the routes
module.exports = app;
module.exports.APIPaths = [...app.stack.map(d => {
    if (d.route) {
        if (d.route.path) return d.route.path;
        else return d.route.regexp.source;
    }
    return null;
}).filter(d => d)];