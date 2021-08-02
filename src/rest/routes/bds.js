const express = require("express");
const app = express.Router();
const { GetKernel } = require("../../../lib/BdsSystemInfo");
const commandExist = require("../../../lib/commandExist");
const { GetPlatform, GetServerVersion, UpdatePlatform, bds_dir } = require("../../../lib/BdsSettings")
const admzip = require("adm-zip");
const bds = require("../../../index");
const { token_verify } = require("../../check");

// Backup
app.get("/backup", (req, res) => {
    const { token } = req.query;
    // Check Token
    if (!(token_verify(token))) return res.status(401).send("Check your token");

    // Return File
    const backup = bds.backup()
    return res.sendFile(backup.file_path)
});


// bds maneger
app.post("/download", (req, res) => {
    const { token, version, platform } = req.body
    if (!(token_verify(token))) return res.status(401).send("Check your token");

    // Server Download
    if (platform) UpdatePlatform(platform);
    try {
        bds.download(version, true, function(){
            return res.json({
                version: version,
                platform: GetPlatform()
            })
        })
    } catch (error) {
        res.status(501).send("Unable to download server for current platform, more details will be in terminal log!")
    }
});

app.post("/upload", (req, res) => {
    const { token } = req.headers;
    if (!(token_verify(token))) return res.status(401).send("Check your token");
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send("No files were uploaded.");

    // Extract
    for (let index of Object.getOwnPropertyNames(req.files)){
        const fileWorld = req.files[index];
        const unzip = new admzip(Buffer.from(fileWorld.data));
        unzip.extractAllTo(bds_dir)
    }
    return res.send("Ok")
});

// Command
app.post("/command", (req, res) => {
    const body = req.body;
    var comand = body.command
    const status = {
        code: 401,
        status: false
    }
    if (token_verify(body.token)) {
        bds.command(comand)
        status.code = 201
        status.status = true
    }
    res.status(status.code).send(status)
});

// System and Server info
app.get("/info", ({ res }) => {
    const config = bds.get_config();
    var info = {
        server: {
            platform: GetPlatform(),
            world_name: config.world,
            running: bds.detect(),
            port: config.portv4,
            port6: config.portv6,
            max_players: config.players,
            whitelist: config.whitelist,
        },
        sys: {
            arch: bds.arch,
            system: process.platform,
            Kernel: GetKernel(),
            IS_CLI: JSON.parse(process.env.IS_BDS_CLI || false),
            IS_DOCKER: JSON.parse(process.env.BDS_DOCKER_IMAGE || false),
            IS_NPX: (process.env.npm_lifecycle_event === "npx"),
            QEMU_STATIC: commandExist("qemu-x86_64-static")
        },
        bds_maneger_core: {
            version: bds.package_json.version,
            server_versions: GetServerVersion(),
        }
    };
    return res.send(info);
});

module.exports = app;