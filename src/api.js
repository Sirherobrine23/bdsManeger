// Node Modules
const os = require("os");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto")
// Bds Maneger Core
const BdsManegerCore = require("../index");
const BdsSystemInfo = require("../src/lib/BdsSystemInfo");
const BdsChecks = require("./UsersAndtokenChecks");
const BdsSettings = require("../src/lib/BdsSettings");

// Init Express
const express = require("express");
const app = express();

// Express Middleware
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const pretty = require("express-prettify");
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(rateLimit({windowMs: 15 * 60 * 1000, /* 15 minutes */ max: 100 /* limit each IP to 100 requests per windowMs*/ }));
app.use(pretty({always: true, spaces: 2}));
app.use(fileUpload({limits: { fileSize: 512 * 1024 }}));
app.use(require("request-ip").mw());

// Routes

app.all(["/v2", "/v2/*"], ({res}) => res.status(401).json({
  Error: "v2 route moved to root routes"
}));

// ? /bds/
app.get(["/bds/info", "/bds", "/"], ({res}) => {
  try {
    const BdsConfig = BdsManegerCore.getBdsConfig();
    const Players = JSON.parse(fs.readFileSync(BdsManegerCore.BdsSettigs.GetPaths("player"), "utf8"))[BdsSettings.GetPlatform()];
    const Offline = Players.filter(player => player.Action === "disconnect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)));
    const Online = Players.filter(player => player.Action === "connect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player && Offline.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)) === -1)))
    const Info = {
      core: {
        version: BdsManegerCore.package_json.version,
        Total_dependencies: Object.keys(BdsManegerCore.package_json.dependencies).length + Object.keys(BdsManegerCore.package_json.devDependencies).length,
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
        Arch: BdsManegerCore.arch,
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
app.get("/bds/info/server", ({res}) => {
  let ServerRunner = require("./BdsManegerServer").BdsRun;
  if (!ServerRunner)ServerRunner = {};
  try {
    const BdsConfig = BdsManegerCore.getBdsConfig();
    const Players = JSON.parse(fs.readFileSync(BdsManegerCore.BdsSettigs.GetPaths("player"), "utf8"))[BdsSettings.GetPlatform()];
    const Offline = Players.filter(player => player.Action === "disconnect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)));
    const Online = Players.filter(player => player.Action === "connect").filter((thing, index, self) => index === self.findIndex((t) => (t.place === thing.place && t.Player === thing.Player && Offline.findIndex((t) => (t.place === thing.place && t.Player === thing.Player)) === -1)))
    const Info = {
      version: BdsConfig.server.versions[BdsSettings.GetPlatform()],
      Platform: BdsSettings.GetPlatform(),
      players: {
        online: Online.length,
        offline: Offline.length,
      },
      Config: BdsManegerCore.get_config(),
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
app.get("/bds/info/server/whitelist", (req, res) => {
  const ServerConfig = BdsManegerCore.get_config();
  if (ServerConfig.whitelist) {
    const { Token = null , Action = null } = req.query;
    const WgiteList = BdsSettings.get_whitelist();
    if (Action) {
      if (Action === "add") {
        if (WgiteList.findIndex(WL => WL.Token === Token) === -1) {
          WgiteList.push({
            Token: Token,
            Time: Date.now()
          });
          fs.writeFileSync(BdsManegerCore.BdsSettigs.GetPaths("whitelist"), JSON.stringify(WgiteList));
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
          fs.writeFileSync(BdsManegerCore.BdsSettigs.GetPaths("whitelist"), JSON.stringify(WgiteList));
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
app.get("/bds/download_server", (req, res) => {
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
app.post("/bds/save_settings", (req, res) => {
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

// Bds Maneger Bridge Communication
app.get("/bds/bridge", (req, res) => {
  const ServerHost = require("./BdsNetwork").host || req.headers.host.replace(/^(.*?):\d+$/, (match, p1) => p1) || require("./BdsNetwork").externalIP.ipv4;
  const ServerConfig = BdsManegerCore.get_config();
  res.json({
    host: ServerHost,
    port: ServerConfig.portv4,
  });
});

// ? /player
const GetPlayerJson = (Platform = BdsManegerCore.getBdsConfig().server.platform) => ([...{...JSON.parse(fs.readFileSync(BdsManegerCore.BdsSettigs.GetPaths("player"), "utf8"))}[Platform]]);
app.get("/players", (req, res) => {
  const { Platform = BdsSettings.GetPlatform(), Player = null, Action = null } = req.query;
  let PlayerList = GetPlayerJson(Platform);
  if (Player) PlayerList = PlayerList.filter(PLS => PLS.Player === Player);
  if (Action) PlayerList = PlayerList.filter(PLS => PLS.Action === Action);
  
  if (Player || Action) {
    if (PlayerList.length > 0) res.json(PlayerList);
    else res.status(404).json({
      Error: "Player not found",
      querys: req.query
    });
    return;
  }
  res.json(PlayerList);
  return;
});

// Players Actions in Backside Manager
// kick player
app.get("/players/kick", (req, res) => {
  const { Token = null, Player = "Sirherobrine", Text = "You have been removed from the Server" } = req.query;
  if (!Token) return res.status(400).json({ error: "Token is required" });
  if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

  // Kick player
  const RunnerServer = require("../../../BdsManegerServer").BdsRun;
  try {
    RunnerServer.kick(Player, Text);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Server nots Run",
      text: `${error}`
    });
  }
});

// Ban player
app.get("/players/ban", (req, res) => {
  const { Token = null, Player = "Sirherobrine" } = req.query;
  if (!Token) return res.status(400).json({ error: "Token is required" });
  if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

  // Ban player
  const RunnerServer = require("../../../BdsManegerServer").BdsRun;
  try {
    RunnerServer.ban(Player);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Server nots Run",
      text: `${error}`
    });
  }
});

// Op player
app.get("/players/op", (req, res) => {
  const { Token = null, Player = "Sirherobrine" } = req.query;
  if (!Token) return res.status(400).json({ error: "Token is required" });
  if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

  // Op player
  const RunnerServer = require("../../../BdsManegerServer").BdsRun;
  try {
    RunnerServer.op(Player);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Server nots Run",
      text: `${error}`
    });
  }
});

// Deop player
app.get("/players/deop", (req, res) => {
  const { Token = null, Player = "Sirherobrine" } = req.query;
  if (!Token) return res.status(400).json({ error: "Token is required" });
  if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

  // Deop player
  const RunnerServer = require("../../../BdsManegerServer").BdsRun;
  try {
    RunnerServer.deop(Player);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Server nots Run",
      text: `${error}`
    });
  }
});

// Say to Server
app.get("/players/say", (req, res) => {
  const { Token = null, Text = "Hello Server" } = req.query;
  if (!Token) return res.status(400).json({ error: "Token is required" });
  if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

  // Say to Server
  const RunnerServer = require("../../../BdsManegerServer").BdsRun;
  try {
    RunnerServer.say(Text);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Server nots Run",
      text: `${error}`
    });
  }
});

// Tp player
app.get("/players/tp", (req, res) => {
  const { Token = null, Player = "Sirherobrine", X = 0, Y = 0, Z = 0 } = req.query;
  if (!Token) return res.status(400).json({ error: "Token is required" });
  if (!BdsChecks.token_verify(Token)) return res.status(400).json({ error: "Token is invalid" });

  // Tp player
  const RunnerServer = require("../../../BdsManegerServer").BdsRun;
  try {
    RunnerServer.tp(Player, {
      x: X,
      y: Y,
      z: Z
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Server nots Run",
      text: `${error}`
    });
  }
});

// Export API Routes
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
  app.listen(port, () => {
    if (typeof callback === "function") callback(port);
  });
  return port;
}

function MainAPI(apiConfig = {api_port: 1932}, callback = function (port){console.log("Bds Maneger Core REST API, http port", port)}){
  var port_rest = 1932;
  if (typeof apiConfig === "object" && apiConfig.api_port !== undefined) port_rest = apiConfig.api_port;
  else if (typeof apiConfig === "number") port_rest = apiConfig;
  return API(port_rest, callback);
}

// Bds Maneger Core API token Register
const path_tokens = path.join(BdsSettings.bds_dir, "bds_tokens.json");
function token_register(Admin_Scoper = ["web_admin", "admin"]) {
  Admin_Scoper = Array.from(Admin_Scoper).filter(scoper => /admin/.test(scoper));
  let tokens = [];
  if (fs.existsSync(path_tokens)) tokens = JSON.parse(fs.readFileSync(path_tokens, "utf8"));
  // Get UUID
  const getBdsUUId = randomUUID().split("-");
  const bdsuid = "bds_" + (getBdsUUId[0]+getBdsUUId[2].slice(0, 15));
  // Save BdsUUID
  tokens.push({
    token: bdsuid,
    date: new Date(),
    scopers: Admin_Scoper
  });
  fs.writeFileSync(path_tokens, JSON.stringify(tokens, null, 4), "utf8");
  return bdsuid;
}

// Bds Maneger Core API Delet token
function delete_token(Token = "") {
  if (!Token) return false;
  if (typeof Token !== "string") return false;
  let tokens = [];
  if (fs.existsSync(path_tokens)) tokens = JSON.parse(fs.readFileSync(path_tokens, "utf8"));
  if (tokens.filter(token => token.token === Token).length > 0) {
    fs.writeFileSync(path_tokens, JSON.stringify(tokens, null, 4), "utf8");
    return true;
  } else return false;
}

// Check Exists Tokens Files
if (!(fs.existsSync(path_tokens))) token_register();

module.exports = MainAPI;
module.exports.api = API;
module.exports.BdsRoutes = app;
module.exports.token_register = token_register;
module.exports.delete_token = delete_token;
module.exports.TokensFilePath = path_tokens;