// Express Routers
const express = require("express");
const app = express.Router();
module.exports = app;
const os = require("os");
const fs = require("fs");
const BdsSystemInfo = require("../lib/BdsSystemInfo");
const BdsSettings = require("../lib/BdsSettings");
const BdsToken = require("../lib/Token");
const ServerManeger = require("../ServerManeger");
const ServerSettings = require("../ServerSettings");
const BdsBackup = require("../BdsBackup");
const BdsDownload = require("../BdsServersDownload");
const BdsVersionManeger = require("@the-bds-maneger/server_versions");
const minecraft_server_util = require("minecraft-server-util");

function ErroRes(res, erro) {
  return res.status(500).json({
    Message: "Sorry, an unexpected error occurred on our part.",
    RawError: String(erro.stack || erro).split(/\r\n|\n/gi),
  });
}

app.get("/", ({res}) => {
  try {
    const BdsConfig = BdsSettings.GetBdsConfig();
    const Info = {
      server: {
        version: BdsConfig.server.versions[BdsSettings.CurrentPlatorm()],
        versions: BdsConfig.server.versions
      },
      host: {
        System: process.platform,
        Arch: BdsSystemInfo.arch,
        Kernel: BdsSystemInfo.GetKernel(),
        Cpu_Model: (os.cpus()[0] || {}).model || null,
        Cores: os.cpus().length
      },
      Backend: {
        npx: false,
        Docker: false,
        CLI: false,
      }
    }
    if (process.env.DOCKER_IMAGE === "true") Info.Backend.Docker = true;
    if (process.env.npm_lifecycle_event === "npx") Info.Backend.npx = true;
    if (process.env.IS_BDS_CLI) Info.Backend.CLI = true;
    res.json(Info);
  } catch (err) {ErroRes(res, err);}
});

// Server Info
app.get("/info_server", async ({res}) => {
  try {
    const ServerSessions = ServerManeger.GetSessions();
    const ServerRunner = Object.keys(ServerSessions).map(session => ServerSessions[session]).map(a => ({
      UUID: a.uuid || "",
      PID: a.PID || 0,
      Uptime: a.Uptime || 0,
      StartTime: a.StartTime || NaN
    }));
    const BdsConfig = BdsSettings.GetBdsConfig();
    delete BdsConfig.telegram;
    const AsyncHostInfo = await BdsSystemInfo.CheckSystemAsync();
    const Info = {
      version: BdsConfig.server.versions[BdsSettings.CurrentPlatorm()],
      Platform: BdsSettings.CurrentPlatorm(),
      Platform_available: Object.keys(AsyncHostInfo.valid_platform).filter(a => AsyncHostInfo.valid_platform[a]),
      players: Object.keys(ServerSessions).map(session => ServerSessions[session]).map(Session => {
        const Users = Session.Players_in_Session();
        const NewUsers = {
          online: [],
          offline: [],
          Users
        };
        for (let Player of Object.keys(Users)) {
          const Playersession = Users[Player];
          if (Playersession.connected) NewUsers.online.push(Player);
          else NewUsers.offline.push(Player);
        }
        return NewUsers
      }),
      Config: BdsConfig,
      Process: ServerRunner
    }
    return res.json(Info);
  } catch (err) {return ErroRes(res, err);}
});

// Get Server Log
app.get("/log", BdsToken.ExpressCheckToken, (req, res) => {
  const Sessions = ServerManeger.GetSessions();
  return res.json(Object.keys(Sessions).map(session => {
    try {
      return {
        UUID: session,
        data: fs.readFileSync(Sessions[session].LogPath, "utf8").replace(/\r\n/gi, "\n").split("\n")
      };
    } catch (err) {
      return {
        UUID: session,
        Error: String(err)
      };
    }
  }));
});


// Create Backup
app.post("/Backup", BdsToken.ExpressCheckToken, ({res}) => {
  const BackupBuffer = BdsBackup.CreateBackup();
  return res.send(BackupBuffer.Buffer);
});

// Download Server
app.get("/server", async ({res}) => res.json(await BdsVersionManeger.listAsync()));
app.post("/server", BdsToken.ExpressCheckToken, async (req, res) => {
  const { Version = "latest" } = req.query;
  try {
    const DownloadResponse = await BdsDownload.DownloadServer(Version);
    return res.json(DownloadResponse);
  } catch (err) {return ErroRes(res, err);}
});

app.get("/settings", async (req, res) => {
  const ConfigServer = await ServerSettings.get_config();
  ConfigServer.MoreInfo = {};
  if (BdsSettings.CurrentPlatorm() === "bedrock") {
    try {
      const Bac = await minecraft_server_util.statusBedrock("localhost", ConfigServer.portv4);
      ConfigServer.MoreInfo.SeverID = Bac.serverID;
      ConfigServer.MoreInfo.Motd = Bac.motd;
      ConfigServer.MoreInfo.Players = Bac.players||{};
      ConfigServer.MoreInfo.Version = Bac.version;
      console.log(Bac);
    } catch (err) {console.log(err)}
  }
  return res.json(ConfigServer);
});
app.post("/settings", BdsToken.ExpressCheckToken, async (req, res) => {
  const ServerConfig = await ServerSettings.get_config();
  if (req.body.world) ServerConfig.world = req.body.world;
  if (req.body.description) ServerConfig.description = req.body.description;
  if (req.body.gamemode) ServerConfig.gamemode = req.body.gamemode;
  if (req.body.difficulty) ServerConfig.difficulty = req.body.difficulty;
  if (req.body.players) ServerConfig.players = req.body.players;
  if (req.body.whitelist) ServerConfig.whitelist = req.body.whitelist;
  if (req.body.portv4) ServerConfig.portv4 = req.body.portv4;
  if (req.body.portv6) ServerConfig.portv6 = req.body.portv6;
  try {
    await ServerSettings.set_config(ServerConfig);
    return res.json(ServerConfig);
  } catch (err) {return ErroRes(res, err);}
});
app.post("/settings/:Config", BdsToken.ExpressCheckToken, async (req, res) => {
  const { Config } = req.params;
  const ServerConfig = await ServerSettings.get_config();
  if (ServerConfig[Config] === undefined) return res.status(404).json({
    error: "Config Not Found",
    message: {
      Config: Config,
      ConfigAvailable: Object.keys(ServerConfig)
    }
  });
  if (!req.body.Value) return res.json({error: "Empty Value, Please provide a value"});
  ServerConfig[Config] = req.body.Value;
  try {
    await ServerSettings.set_config(ServerConfig);
    return res.json(ServerConfig);
  } catch (err) {return ErroRes(res, err);}
});