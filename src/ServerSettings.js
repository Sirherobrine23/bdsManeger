var fs = require("fs");
const path = require("path");
const propertiesToJSON = require("properties-to-json");
const BdsSettings = require("../src/lib/BdsSettings");
const { GetPaths, CurrentPlatorm } = BdsSettings;
const TOML = require("@iarna/toml");
const nbt = require("prismarine-nbt");
const crypto = require("crypto");

function CreateConfigToBedrock(
  WorldName = "Bedrock",
  ServerMotd = "Hello, is my Minecraft Bedrock Sever",
  DefaultGameMode = "creative",
  ServerDifficulty = "normal",
  LevelSeed = "",
  AllowCheats = false,
  ServerLimitPlayers = 20,
  RequiredAccout = true,
  EnableWhitelist = false,
  ServerPort = 19132,
  ServerPortV6 = 19132,
  PlayerDefaultPermission = "member",
  ) {
  return ([
    "# By The Bds Maneger project",
    `# Date: ${(new Date()).toString()}`,
    "",
    // World Settings
    `level-name=${WorldName}`,
    `server-name=${ServerMotd}`,
    `gamemode=${DefaultGameMode}`,
    `difficulty=${ServerDifficulty}`,
    `level-seed=${LevelSeed}`,
    `allow-cheats=${AllowCheats}`,
    `max-players=${ServerLimitPlayers}`,
    `online-mode=${RequiredAccout}`,
    `white-list=${EnableWhitelist}`,
    `server-port=${ServerPort}`,
    `server-portv6=${ServerPortV6}`,
    `default-player-permission-level=${PlayerDefaultPermission}`,
    // Backend Maneger
    "tick-distance=32",
    "max-threads=8",
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
  ]).join("\n");
}

function CreateConfigToJava(
  WorldName = "world",
  ServerMotd = "Hello, is my Minecraft Java Sever",
  DefaultGameMode = "creative",
  ServerDifficulty = "normal",
  LevelSeed = "",
  AllowCheats = false,
  ServerLimitPlayers = 20,
  RequiredAccout = true,
  EnableWhitelist = false,
  ServerPort = 19132
) {
  let HeadCore = false;
  if (DefaultGameMode === "headcore") {
    DefaultGameMode = "survival";
    HeadCore = true;
  }
  return ([
    "# By The Bds Maneger project",
      `# Date: ${Date.now()}`,
      "",
      // World Settings
      `level-name=${WorldName}`,
      `motd=${ServerMotd}`,
      `gamemode=${DefaultGameMode}`,
      `difficulty=${ServerDifficulty}`,
      `level-seed=${LevelSeed}`,
      `enable-command-block=${AllowCheats}`,
      `max-players=${ServerLimitPlayers}`,
      `online-mode=${RequiredAccout}`,
      `white-list=${EnableWhitelist}`,
      `server-port=${ServerPort}`,
      `hardcore=${HeadCore}`,
      "level-type=default",
      "op-permission-level=4",
      "pvp=true",
      "allow-nether=true",
      // Rcon
      "enable-rcon=false",
      `rcon.password=${crypto.randomBytes(6).toString("hex")}`,
      "rcon.port=25575",
      "broadcast-rcon-to-ops=true",
      // Anothers
      "query.port=65551",
      "enable-jmx-monitoring=false",
      "enable-query=true",
      "generator-settings=",
      "generate-structures=true",
      "network-compression-threshold=256",
      "max-tick-time=60000",
      "use-native-transport=true",
      "enable-status=true",
      "allow-flight=false",
      "view-distance=32",
      "max-build-height=256",
      "server-ip=",
      "sync-chunk-writes=true",
      "prevent-proxy-connections=false",
      "resource-pack=",
      "entity-broadcast-range-percentage=100",
      "player-idle-timeout=0",
      "force-gamemode=false",
      "rate-limit=0",
      "broadcast-console-to-ops=true",
      "spawn-npcs=true",
      "spawn-animals=true",
      "snooper-enabled=true",
      "function-permission-level=2",
      "text-filtering-config=",
      "spawn-monsters=true",
      "enforce-whitelist=false",
      "resource-pack-sha1=",
      "spawn-protection=16",
      "max-world-size=29999984",
      "require-resource-pack=true",
      "resource-pack-prompt=",
      "hide-online-players=false",
      "simulation-distance=10",
    ]).join("\n");
}

// Set Config
async function bds_config(NewConfig = {world: "Bds Maneger", description: "The Bds Maneger", gamemode: "creative", difficulty: "normal", players: 10, commands: true, account: true, whitelist: true, port: 19132, portv6: 19133, seed: ""}, BdsPlatform = CurrentPlatorm()){
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
    const BedrockProperties = path.join(BdsSettings.GetPaths("bedrock", true), "server.properties");
    const BedrockConfig = CreateConfigToBedrock(JsonConfig.world, JsonConfig.description, JsonConfig.gamemode, JsonConfig.difficulty, JsonConfig.seed, false, JsonConfig.players, JsonConfig.account, JsonConfig.whitelist, JsonConfig.port, JsonConfig.portv6);
    fs.writeFileSync(BedrockProperties, BedrockConfig);
    return BedrockConfig;
  } else if (BdsPlatform === "java") {
    const JavaProperties = path.join(BdsSettings.GetPaths("java", true), "server.properties");
    const JavaConfig = CreateConfigToJava(JsonConfig.world, JsonConfig.description, JsonConfig.gamemode, JsonConfig.difficulty, JsonConfig.seed, false, JsonConfig.players, JsonConfig.account, JsonConfig.whitelist, JsonConfig.port, JsonConfig.portv6);
    fs.writeFileSync(JavaProperties, JavaConfig);
    return JavaConfig;
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
  throw new Error("Backend Reject Instruction");
  // fs.writeFileSync(ConfigFilePath[BdsPlatform], Config.join("\n"))
  return Config.join("\n");
}

// Get Config
async function bds_get_config(){
  const BdsPlatform = CurrentPlatorm();
  var config;
  const JsonConfig = {
    world: "",
    description: "",
    gamemode: "",
    difficulty: "",
    players: 0,
    whitelist: false,
    portv4: 0,
    portv6: 0,
    nbt: {}
  };
  
  if (BdsPlatform === "bedrock") {
    const BedrockProperties = path.join(BdsSettings.GetPaths("bedrock", true), "server.properties");
    if (fs.existsSync(BedrockProperties)) {
      config = propertiesToJSON(fs.readFileSync(BedrockProperties, "utf8"));
      
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
      const BedrockLevelData = path.join(GetPaths("bedrock", true), "worlds", JsonConfig.world, "level.dat");
      if (fs.existsSync(BedrockLevelData)) JsonConfig.nbt = (await nbt.parse(fs.readFileSync(BedrockLevelData))).parsed.value;
    }
  }
  else if (BdsPlatform === "java") {
    const JavaProperties = path.join(BdsSettings.GetPaths("java", true), "server.properties");
    if (fs.existsSync(JavaProperties)) {
      config = propertiesToJSON(fs.readFileSync(JavaProperties, "utf8"));
      
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
      
      const ParsedNBTJava = (await nbt.parse(fs.readFileSync(path.join(GetPaths("java", true), JsonConfig.world, "level.dat")))).parsed.value;
      JsonConfig.nbt = ParsedNBTJava.Data.value||ParsedNBTJava.Data||ParsedNBTJava;
    }
  }
  else if (BdsPlatform === "pocketmine") {
    const PocketMineProperties = path.join(BdsSettings.GetPaths("pocketmine", true), "server.properties");
    if (fs.existsSync(PocketMineProperties)) {
      config = propertiesToJSON(fs.readFileSync(PocketMineProperties, "utf8"));
      
      // Players
      JsonConfig.world = config["level-name"];
      JsonConfig.description = config["motd"];
      // Gamemode
      if (parseInt(config["gamemode"]) === 0) JsonConfig.gamemode = "survival";
      else if (parseInt(config["gamemode"]) === 1) JsonConfig.gamemode = "creative";
      else JsonConfig.gamemode = "";
      
      // Difficulty
      if (parseInt(config["difficulty"]) === 0) JsonConfig.difficulty = "easy";
      else if (parseInt(config["difficulty"]) === 1) JsonConfig.difficulty = "peaceful";
      else if (parseInt(config["difficulty"]) === 2) JsonConfig.difficulty = "normal";
      else if (parseInt(config["difficulty"]) === 3) JsonConfig.difficulty = "hard";
      else JsonConfig.difficulty = "";

      JsonConfig.players = parseInt(config["max-players"]);
      JsonConfig.account = (config["xbox-auth"] === "on");
      JsonConfig.whitelist = (config["white-list"] === "true");
      
      // Server/World
      JsonConfig.portv4 = parseInt(config["server-port"]);
      JsonConfig.portv6 = parseInt(config["server-port"]);
      JsonConfig.seed = config["level-seed"];
      JsonConfig.commands = false;
      // JsonConfig.worldtype = config["level-type"];
      const PocketmineLevelData = path.join(GetPaths("pocketmine", true), "worlds", JsonConfig.world, "level.dat");
      if (fs.existsSync(PocketmineLevelData)) JsonConfig.nbt = (await nbt.parse(fs.readFileSync(PocketmineLevelData))).parsed.value;
    }
  } else if (BdsPlatform === "dragonfly") {
    const DragonflyProperties = path.join(BdsSettings.GetPaths("dragonfly", true), "server.properties");
    if (fs.existsSync(DragonflyProperties)) {
      const ConfigFile = TOML.parse(fs.readFileSync(DragonflyProperties, "utf8"));
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
  }
  return JsonConfig;
}

// Get Withelist
async function bds_get_whitelist(BdsPlatform = CurrentPlatorm()){
  const ReturnArrayWithPlayers = [];
  if (BdsPlatform === "bedrock") {}

  return ReturnArrayWithPlayers;
}

// Export modules
module.exports.set_config = bds_config;
module.exports.config = bds_config;
module.exports.get_config = bds_get_config;
module.exports.get_whitelist = bds_get_whitelist;
