// Node Modules
const os = require("os");
const fs = require("fs");
// Bds Maneger Core
const BdsManegerCore = require("../src/index");
const BdsSystemInfo = require("../src/lib/BdsSystemInfo");
const BdsSettings = require("../src/lib/BdsSettings");
const TokenManeger = require("./lib/Token");

// Init Express
const express = require("express");
const app = express();

// Express Middleware
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const pretty = require("express-prettify");
const cors = require("cors");
const express_rate_limit = require("express-rate-limit");
const request_ip = require("request-ip");
app.use(cors());
app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(pretty({always: true, spaces: 2}));
app.use(fileUpload({limits: { fileSize: 512 * 1024 }}));
app.use(request_ip.mw());
app.use(express_rate_limit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 500 // limit each IP to 500 requests per windowMs
}));

// Init Socket.io
const Server = require("http").createServer(app);
const SocketIo = require("socket.io");
const io = new SocketIo.Server(Server);
io.use(function (socket, next) {
  const { headers, query } = socket.handshake;
  const Token = headers["authorizationtoken"] || query["token"] || query["Token"];
  if (Token) {
    if (TokenManeger.CheckToken(Token, "all")) {
      socket.token = Token;
      return next();
    }
  }
  return next(new Error("Token is not valid"));
});
io.on("connection", socket => {
  console.log("Socket.io connection ID:", socket.token);
});
module.exports.SocketIO = io;

// Routes
app.all(["/v2", "/v2/*"], ({res}) => res.status(401).json({
  Error: "v2 route moved to root routes"
}));

// Check Token
function CheckToken (req, res, next) {
  if (req.headers["authorizationtoken"]) {
    if (TokenManeger.CheckToken(req.headers["authorizationtoken"], "all")) {
      req.token = req.headers["authorizationtoken"];
      return next();
    }
  } else if (req.method === "GET") {
    if (req.query.token) {
      if (TokenManeger.CheckToken(req.query.token, "all")) {
        req.token = req.query.token;
        return next();
      }
    } else if (req.headers.token) {
      if (TokenManeger.CheckToken(req.headers.token, "all")) {
        req.token = req.headers.token;
        return next();
      }
    } else if (req.query.Token) {
      if (TokenManeger.CheckToken(req.query.Token, "all")) {
        req.token = req.query.Token;
        return next();
      }
    } else if (req.headers.Token) {
      if (TokenManeger.CheckToken(req.headers.Token, "all")) {
        req.token = req.headers.token;
        return next();
      }
    }
  } else {
    if (req.body.token) {
      if (TokenManeger.CheckToken(req.body.token, "all")) {
        req.token = req.body.token;
        return next();
      }
    } else if (req.headers.token) {
      if (TokenManeger.CheckToken(req.headers.token, "all")) {
        req.token = req.headers.token;
        return next();
      }
    } else if (req.body.Token) {
      if (TokenManeger.CheckToken(req.body.Token, "all")) {
        req.token = req.body.Token;
        return next();
      }
    } else if (req.headers.Token) {
      if (TokenManeger.CheckToken(req.headers.Token, "all")) {
        req.token = req.headers.Token;
        return next();
      }
    }
  }
  return res.status(401).json({
    error: "Unauthorized",
    message: "Token is not valid"
  });
}

// ? /bds/
app.get(["/bds/info", "/bds", "/"], ({res}) => {
  try {
    const BdsConfig = BdsManegerCore.BdsSettings.GetJsonConfig();
    const Info = {
      core: {
        version: BdsManegerCore.version,
        Total_dependencies: Object.keys(BdsManegerCore.ExtraJSON.Package.dependencies).length + Object.keys(BdsManegerCore.ExtraJSON.Package.devDependencies).length,
      },
      server: {
        version: BdsConfig.server.versions[BdsSettings.GetPlatform()],
        versions: BdsConfig.server.versions
      },
      host: {
        System: process.platform,
        Arch: BdsManegerCore.arch,
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
  } catch (error) {
    res.status(500).json({
      error: "Backend Error",
      message: `${error}`
    });
  }
});

// Server Info
app.get("/bds/info/server", async ({res}) => {
  const ServerSessions = require("./ServerManeger").GetSessions();
  const ServerRunner = Object.keys(ServerSessions).map(session => ServerSessions[session]).map(a => ({
    UUID: a.uuid || "",
    PID: a.PID || 0,
    Uptime: a.Uptime || 0,
    StartTime: a.StartTime || NaN
  }));
  const BdsConfig = BdsManegerCore.BdsSettings.GetJsonConfig();
  
  // Delete Info
  delete BdsConfig.telegram;
  delete BdsConfig.cloud;

  const AsyncHostInfo = await BdsManegerCore.BdsSystemInfo.CheckSystemAsync();

  const Info = {
    version: BdsConfig.server.versions[BdsSettings.GetPlatform()],
    Platform: BdsSettings.GetPlatform(),
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
});

// Get Server Log
app.get(["/bds/log", "/log"], CheckToken, (req, res) => {
  const Sessions = BdsManegerCore.BdsManegerServer.GetSessions();
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
app.get("/bds/backup", CheckToken, ({res}) => {
  const BackupBuffer = BdsManegerCore.BdsBackup.CreateBackup();
  return res.send(BackupBuffer.Buffer);
});

// Download Server
app.get("/bds/download_server", CheckToken, (req, res) => {
  const { Version = "latest" } = req.query;

  // Download Server
  BdsManegerCore.download(Version, true).then(() => {
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
app.post("/bds/save_settings", CheckToken, (req, res) => {
  const {
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

  // Save Settings
  try {
    BdsManegerCore.set_config({
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

app.post("/bds/save_settings/:Config", CheckToken, (req, res) => {
  const { Config } = req.params;
  const ServerConfig = BdsManegerCore.BdsServerSettings.get_config();
  if (typeof ServerConfig[Config] === "undefined") return res.status(404).json({
    error: "Config Not Found",
    message: {
      Config: Config,
      ConfigAvailable: Object.keys(ServerConfig)
    }
  });
  ServerConfig[Config] = req.body.Value;
  try {
    BdsManegerCore.BdsServerSettings.config(ServerConfig);
    res.json({
      message: "Settings Saved",
      Config: {
        Config: Config,
        Value: ServerConfig[Config]
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: "Backend Error",
      message: (`${err.stack || err}`).split(/\r\n|\n/gi)
    });
  }
});

app.get("/bds/get_settings", ({res}) => {
  res.json(BdsManegerCore.BdsServerSettings.get_config());
});

// Bds Maneger Bridge Communication
app.get("/bds/Connect", async (req, res) => {
  const ServerHost = req.headers.host.replace(/^(.*?):\d+$/, (match, p1) => p1) || require("./BdsNetwork").externalIP.ipv4;
  const ServerConfig = BdsManegerCore.BdsServerSettings.get_config();
  res.json({
    host: ServerHost,
    port: ServerConfig.portv4,
  });
});

// ? /player
app.get("/players", CheckToken, (req, res) => {
  let PlayerList = JSON.parse(fs.readFileSync(BdsManegerCore.BdsSettings.GetPaths("player"), "utf8"))
  const { Platform = null, Player = null, Action = null } = req.query;

  if (Platform) PlayerList = PlayerList.filter(PLS => PLS.Platform === Platform);
  if (Player) PlayerList = PlayerList.filter(PLS => PLS.Player === Player);
  if (Action) PlayerList = PlayerList.filter(PLS => PLS.Action === Action);

  return res.json(PlayerList);
});

// Players Actions in Backside Manager
// kick player
app.get("/players/kick", CheckToken, (req, res) => {
  const { Player = "Sirherobrine", Text = "You have been removed from the Server" } = req.query;

  // Kick player
  const Sessions = require("./ServerManeger").GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.kick(Player, Text));
    return res.json({ success: true });
  } else {
    res.status(400).json({
      error: "Server nots Run"
    });
  }
});

// Ban player
app.get("/players/ban", CheckToken, (req, res) => {
  const { Player = "Sirherobrine" } = req.query;

  // Ban player
  const Sessions = require("./ServerManeger").GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.ban(Player));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Op player
app.get("/players/op", CheckToken, CheckToken, (req, res) => {
  const { Player = "Sirherobrine" } = req.query;

  // Op player
  const Sessions = require("./ServerManeger").GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.op(Player));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Deop player
app.get("/players/deop", (req, res) => {
  const { Player = "Sirherobrine" } = req.query;

  // Deop player
  const Sessions = require("./ServerManeger").GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.deop(Player));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Say to Server
app.get("/players/say", CheckToken, (req, res) => {
  const { Text = "Hello Server" } = req.query;

  // Say to Server
  const Sessions = require("./ServerManeger").GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.say(Text));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Tp player
app.get("/players/tp", (req, res) => {
  const { Player = "Sirherobrine", X = 0, Y = 0, Z = 0 } = req.query;

  // Tp player
  const Sessions = require("./ServerManeger").GetSessionsArray();
  if (Sessions.length > 0) {
    Sessions.forEach(RunnerServer => RunnerServer.tp(Player, X, Y, Z));
    return res.sendStatus(200);
  }
  res.status(400).json({
    error: "Server nots Run"
  });
});

// Export API Routes
/**
 * @param {Number} port_api - Port of API, default is 1932
 * @callback {Function} callback - Callback function when API is ready
 * 
 * Launch an API To manage the server Remotely, some features are limited.
 */
function API(port_api = 1932, callback = port => {console.log("Bds Maneger Core REST API, http port", port)}){
  const MapRoutes = app._router.stack.map(d => {if (d.route) {if (d.route.path) return d.route.path;else return d.route.regexp.source;} else return null;}).filter(d => d);
  app.all("*", (req, res) => {
    return res.status(404).json({
      error: "Not Found",
      message: "The requested URL " + req.originalUrl || req.path + " was not found on this server.",
      AvaibleRoutes: MapRoutes
    });
  });
  const port = (port_api || 1932);
  Server.listen(port, () => {
    if (typeof callback === "function") callback(port);
  });
  return port;
}

module.exports.api = API;
module.exports.BdsRoutes = {
  App: app,
  Server: Server
};
