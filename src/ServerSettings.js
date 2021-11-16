var fs = require("fs");
const path = require("path");
const propertiesToJSON = require("properties-to-json");
const BdsInfo = require("../lib/BdsSystemInfo");
const { GetServerPaths, GetPlatform } = require("../lib/BdsSettings");
const TOML = require("@iarna/toml");

const ConfigFilePath = {
  bedrock: path.join(GetServerPaths("bedrock"), "server.properties"),
  java: path.join(GetServerPaths("java"), "server.properties"),
  pocketmine: path.join(GetServerPaths("pocketmine"), "server.properties"),
  dragonfly: path.join(GetServerPaths("dragonfly"), "config.toml"),
}

// Set Config
function bds_config(NewConfig = {world: "Bds Maneger", description: "The Bds Maneger", gamemode: "creative", difficulty: "normal", players: 10, commands: true, account: true, whitelist: true, port: 19132, portv6: 19133, seed: ""}){
  const BdsPlatform = GetPlatform();
  const JsonConfig = {
    world: "Bds Maneger",
    description: "The Bds Maneger",
    gamemode: "creative",
    difficulty: "normal",
    players: 10,
    commands: true,
    account: true,
    whitelist: false,
    port: 19132,
    portv6: 19133,
    seed: ""
  };

  // Strings
  if (typeof NewConfig.world === "string" && NewConfig.world) JsonConfig.world = NewConfig.world
  if (typeof NewConfig.description === "string" && NewConfig.description) JsonConfig.description = NewConfig.description
  if (typeof NewConfig.gamemode === "string" && NewConfig.gamemode) JsonConfig.gamemode = NewConfig.gamemode
  if (typeof NewConfig.difficulty === "string" && NewConfig.difficulty) JsonConfig.difficulty = NewConfig.difficulty
  if ((typeof NewConfig.seed === "string" || typeof NewConfig.seed === "number") && NewConfig.seed) JsonConfig.seed = NewConfig.seed
  
  // Booleans
  if (typeof NewConfig.commands === "boolean" && (NewConfig.commands || NewConfig.commands === false)) JsonConfig.commands = NewConfig.commands
  if (typeof NewConfig.account === "boolean" && (NewConfig.account || NewConfig.account === false)) JsonConfig.account = NewConfig.account
  if (typeof NewConfig.whitelist === "boolean" && (NewConfig.whitelist || NewConfig.whitelist === false)) JsonConfig.whitelist = NewConfig.whitelist
  
  // Numbers
  if (typeof NewConfig.port === "number" && NewConfig.port) JsonConfig.port = NewConfig.port
  if (typeof NewConfig.players === "number" && NewConfig.players) JsonConfig.players = NewConfig.players
  if (typeof NewConfig.portv6 === "number" && NewConfig.portv6) JsonConfig.portv6 = NewConfig.portv6
  
  const Config = [];
  if (BdsPlatform === "bedrock") {
    const bedrockCPUThread = BdsInfo.GetCpuCoreCount();
    var tickDistance; if (!(bedrockCPUThread % 2)) tickDistance = bedrockCPUThread; else tickDistance = 1;
    Config.push(
      "# By The Bds Maneger project",
      `# Date: ${Date.now()}`,
      "",
      `level-name=${JsonConfig.world}`,
      `server-name=${JsonConfig.description}`,
      `gamemode=${JsonConfig.gamemode}`,
      `difficulty=${JsonConfig.difficulty}`,
      `allow-cheats=${JsonConfig.commands}`,
      `max-players=${JsonConfig.players}`,
      `online-mode=${JsonConfig.account}`,
      `white-list=${JsonConfig.whitelist}`,
      `server-port=${JsonConfig.port}`,
      `server-portv6=${JsonConfig.portv6}`,
      `tick-distance=${tickDistance}`,
      `max-threads=${bedrockCPUThread}`,
      `level-seed=${JsonConfig.seed}`,
      "default-player-permission-level=member",
      "view-distance=32",
      "player-idle-timeout=0",
      "texturepack-required=true",
      "content-log-file-enabled=false",
      "compression-threshold=1",
      "server-authoritative-movement=server-auth",
      "player-movement-score-threshold=20",
      "player-movement-distance-threshold=0.3",
      "player-movement-duration-threshold-in-ms=500",
      "correct-player-movement=false",
      "server-authoritative-block-breaking=false",
    );
  } else if (BdsPlatform === "java") {
    Config.push(
      "# By The Bds Maneger project",
      `# Date: ${Date.now()}`,
      "",
      `level-name=${JsonConfig.world}`,
      `motd=${JsonConfig.description}`,
      `gamemode=${JsonConfig.gamemode}`,
      `enable-command-block=${JsonConfig.commands}`,
      `difficulty=${JsonConfig.difficulty}`,
      `max-players=${JsonConfig.players}`,
      `online-mode=${JsonConfig.account}`,
      `server-port=${JsonConfig.port}`,
      `hardcore=${JsonConfig}`,
      `white-list=${JsonConfig}`,
      `level-seed=${JsonConfig.seed}`,
      "enable-rcon=false",
      "query.port=65551",
      "enable-jmx-monitoring=false",
      "rcon.port=25575",
      "enable-query=true",
      "generator-settings=",
      "pvp=true",
      "generate-structures=true",
      "network-compression-threshold=256",
      "max-tick-time=60000",
      "use-native-transport=true",
      "enable-status=true",
      "allow-flight=false",
      "broadcast-rcon-to-ops=true",
      "view-distance=32",
      "max-build-height=256",
      "server-ip=",
      "allow-nether=true",
      "sync-chunk-writes=true",
      "op-permission-level=4",
      "prevent-proxy-connections=false",
      "resource-pack=",
      "entity-broadcast-range-percentage=100",
      "rcon.password=25as65d3",
      "player-idle-timeout=0",
      "force-gamemode=false",
      "rate-limit=0",
      "broadcast-console-to-ops=true",
      "spawn-npcs=true",
      "spawn-animals=true",
      "snooper-enabled=true",
      "function-permission-level=2",
      "level-type=default",
      "text-filtering-config=",
      "spawn-monsters=true",
      "enforce-whitelist=false",
      "resource-pack-sha1=",
      "spawn-protection=16",
      "max-world-size=29999984",
    );
  } else if (BdsPlatform === "dragonfly") {
    Config.push(
      "",
      "[Network]",
      `  Address = ":${JsonConfig.port}"`,
      "",
      "[Players]",
      "  Folder = \"players\"",
      "  MaxCount = 0",
      "  MaximumChunkRadius = 32",
      "  SaveData = true",
      "",
      "[Resources]",
      "  Folder = \"resources\"",
      "",
      "[Server]",
      "  AuthEnabled = true",
      "  JoinMessage = \"%v has joined the game\"",
      `  Name = "${JsonConfig.description}"`,
      "  QuitMessage = \"%v has left the game\"",
      "  ShutdownMessage = \"Server closed.\"",
      "",
      "[World]",
      "  Folder = \"world\"",
      `  Name = "${JsonConfig.world}"`,
      "  SimulationDistance = 8",
      ""
    );
  } else if (BdsPlatform === "pocketmine") {
    // Whitelist
    if (JsonConfig.whitelist === true) JsonConfig.whitelist = "on";
    else JsonConfig.whitelist = "off";
    
    // difficulty
    if (JsonConfig.difficulty === "easy") JsonConfig.difficulty = 0;
    else if (JsonConfig.difficulty === "peaceful") JsonConfig.difficulty = 1;
    else if (JsonConfig.difficulty === "normal") JsonConfig.difficulty =  2;
    else if (JsonConfig.difficulty === "hard") JsonConfig.difficulty =  3;
    else throw new Error("Difficulty error");
    
    // Required Accoutn
    if (JsonConfig.account === true) JsonConfig.account = "on";
    else JsonConfig.account =  "off";
    
    // Config
    Config.push(
      "# By The Bds Maneger project",
      `# Date: ${Date.now()}`,
      "",
      "language=eng",
      `level-name=${JsonConfig.world}`,
      `motd=${JsonConfig.description}`,
      `server-port=${JsonConfig.port}`,
      `white-list=${JsonConfig.whitelist}`,
      `max-players=${JsonConfig.players}`,
      `gamemode=${JsonConfig.gamemode}`,
      `difficulty=${JsonConfig.difficulty}`,
      `xbox-auth=${JsonConfig.account}`,
      `level-seed=${JsonConfig.seed}`,
      "view-distance=32",
      "hardcore=0",
      "announce-player-achievements=on",
      "spawn-protection=16",
      "force-gamemode=off",
      "pvp=on",
      "generator-settings=",
      "level-type=DEFAULT",
      "enable-query=on",
      "enable-rcon=off",
      "rcon.password=F/deZ5kefY",
      "auto-save=on",
    );
  }
  fs.writeFileSync(ConfigFilePath[BdsPlatform], Config.join("\n"))
  return Config.join("\n");
}

// Get Config
function bds_get_config(){
  const BdsPlatform = GetPlatform();
  var config;
  const JsonConfig = {
    world: "",
    description: "",
    gamemode: "",
    difficulty: "",
    players: "",
    whitelist: null,
    portv4: 0,
    portv6: 0,
  };
  
  if (BdsPlatform === "bedrock") {
    if (fs.existsSync(ConfigFilePath[BdsPlatform])) {
      config = propertiesToJSON(fs.readFileSync(ConfigFilePath["bedrock"], "utf8"));
      
      // Players
      JsonConfig.world = config["level-name"];
      JsonConfig.description = config["server-name"];
      JsonConfig.gamemode = config["gamemode"];
      JsonConfig.difficulty = config["difficulty"];
      JsonConfig.players = parseInt(config["max-players"]);
      JsonConfig.account = (config["online-mode"] === "true");
      JsonConfig.whitelist = (config["white-list"] === "true");
      
      // Server/World
      JsonConfig.portv4 = parseInt(config["server-port"]);
      JsonConfig.portv6 = parseInt(config["server-portv6"]);
      JsonConfig.seed = config["level-seed"];
      JsonConfig.commands = (config["allow-cheats"] === "true");
      // JsonConfig.worldtype = "default";
    }
  }
  else if (BdsPlatform === "java") {
    if (fs.existsSync(ConfigFilePath[BdsPlatform])) {
      config = propertiesToJSON(fs.readFileSync(path.join(ConfigFilePath["java"], "server.properties"), "utf8"));
      
      // Players
      JsonConfig.world = config["level-name"];
      JsonConfig.description = config["motd"];
      JsonConfig.gamemode = config["gamemode"];
      JsonConfig.difficulty = config["difficulty"];
      JsonConfig.players = parseInt(config["max-players"]);
      JsonConfig.account = (config["online-mode"] === "true");
      JsonConfig.whitelist = (config["white-list"] === "true");
      
      // Server/World
      JsonConfig.portv4 = parseInt(config["server-port"]);
      JsonConfig.portv6 = parseInt(config["server-port"]);
      JsonConfig.seed = config["level-seed"];
      JsonConfig.commands = (config["enable-command-block"] === "true");
      // JsonConfig.worldtype = config["level-type"];
    }
  }
  else if (BdsPlatform === "pocketmine") {
    if (fs.existsSync(ConfigFilePath[BdsPlatform])) {
      config = propertiesToJSON(fs.readFileSync(path.join(ConfigFilePath["pocketmine"], "server.properties"), "utf8"));
      
      // Players
      JsonConfig.world = config["level-name"];
      JsonConfig.description = config["motd"];
      JsonConfig.gamemode = (()=>{let test = parseInt(config["gamemode"]);if (test === 0) return "survival";else if (test === 1) return "creative";else return undefined;})();
      JsonConfig.difficulty = (()=>{let test = parseInt(config["difficulty"]);if (test === 0) return "easy";else if (test === 1) return "peaceful";else if (test === 2) return "normal";else if (test === 3) return "hard";else return undefined;})();
      JsonConfig.players = parseInt(config["max-players"]);
      JsonConfig.account = (config["xbox-auth"] === "on");
      JsonConfig.whitelist = (config["white-list"] === "true");
      
      // Server/World
      JsonConfig.portv4 = parseInt(config["server-port"]);
      JsonConfig.portv6 = parseInt(config["server-port"]);
      JsonConfig.seed = config["level-seed"];
      JsonConfig.commands = false;
      // JsonConfig.worldtype = config["level-type"];
    }
  } else if (BdsPlatform === "dragonfly") {
    if (fs.existsSync(ConfigFilePath[BdsPlatform])) {
      const ConfigFile = TOML.parse(fs.readFileSync(ConfigFilePath[BdsPlatform], "utf8"));
      JsonConfig.world = ConfigFile.World.Name;
      JsonConfig.description = ConfigFile.Server.Name;
      JsonConfig.gamemode = "creative";
      JsonConfig.difficulty = null;
      JsonConfig.players = parseInt(ConfigFile.Players.MaxCount || 0);
      JsonConfig.account = false;
      JsonConfig.whitelist = null;
      JsonConfig.portv4 = parseInt(ConfigFile.Network.Address.replace(":", ""));
      JsonConfig.portv6 = parseInt(ConfigFile.Network.Address.replace(":", ""));
      JsonConfig.seed = null;
      JsonConfig.commands = false;
    }
  } else throw new Error("Platform no exists, check config file");
  return JsonConfig;
}

// Get Withelist
function bds_get_whitelist(){
  const BdsPlatform = GetPlatform();
  const ToReturn = [];
  
  // Bedrock
  if (BdsPlatform === "bedrock") {
    if (fs.existsSync(path.join(GetServerPaths("bedrock"), "whitelist.json"))) {
      const LocalWhitelist = JSON.parse(fs.readFileSync(path.join(GetServerPaths("bedrock"), "whitelist.json"), "utf8"));
      for (let i = 0; i < LocalWhitelist.length; i++) {
        const Player = LocalWhitelist[i];
        ToReturn.push({
          name: Player.name,
          // permissons: Player.permission,
        });
      }
    }
  }

  // Pocketmine
  else if (BdsPlatform === "pocketmine") {
    throw new Error("Not implemented yet");
  }

  // Java and Spigot
  else if (BdsPlatform === "java" || BdsPlatform === "spigot") {
    throw new Error("Not implemented yet");
  }
  
  // If not exists Platform return throw
  else throw new Error("Platform no exists, check config file");

  return ToReturn;
}

// Export modules
module.exports.config = bds_config
module.exports.get_config = bds_get_config
module.exports.get_whitelist = bds_get_whitelist
