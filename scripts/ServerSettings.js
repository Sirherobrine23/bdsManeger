var fs = require("fs");
const path = require("path");
const propertiesToJSON = require("properties-to-json");
const { join } = require("path");
const { GetServerPaths, GetPlatform } = require("../lib/BdsSettings");
const bds_dir_bedrock = GetServerPaths("bedrock"), bds_dir_java = GetServerPaths("java"), bds_dir_pocketmine = GetServerPaths("pocketmine");
const bedrockCPUThread = require("os").cpus().length;

function bds_config(
    NewConfig = {
        world: "Bds Maneger",
        description: "The Bds Maneger",
        gamemode: "creative",
        difficulty: "normal",
        players: 10,
        commands: true,
        account: true,
        whitelist: true,
        port: 19132,
        portv6: 19133,
        seed: ""
    }
){
    let JsonConfig = {
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

    var tickDistance;
    if (bedrockCPUThread >= 12) tickDistance = 12;
    else if (bedrockCPUThread >= 10) tickDistance = 10;
    else if (bedrockCPUThread >= 8) tickDistance = 8;
    else if (bedrockCPUThread >= 6) tickDistance = 6;
    else if (bedrockCPUThread >= 4) tickDistance = 4;
    else if (bedrockCPUThread >= 2) tickDistance = 2;
    else tickDistance = 1;
    
    if (NewConfig.world) JsonConfig.world = NewConfig.world
    if (NewConfig.description) JsonConfig.description = NewConfig.description
    if (NewConfig.gamemode) JsonConfig.gamemode = NewConfig.gamemode
    if (NewConfig.difficulty) JsonConfig.difficulty = NewConfig.difficulty
    if (NewConfig.players) JsonConfig.players = NewConfig.players
    if (NewConfig.commands || NewConfig.commands === false) JsonConfig.commands = NewConfig.commands
    if (NewConfig.account || NewConfig.account === false) JsonConfig.account = NewConfig.account
    if (NewConfig.whitelist || NewConfig.whitelist === false) JsonConfig.whitelist = NewConfig.whitelist
    if (NewConfig.port) JsonConfig.port = NewConfig.port
    if (NewConfig.portv6) JsonConfig.portv6 = NewConfig.portv6
    if (NewConfig.seed) JsonConfig.seed = NewConfig.seed
    var Config, ConfigFile;
    if (GetPlatform() === "bedrock") {
        ConfigFile = join(bds_dir_bedrock, "server.properties");
        Config = [
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
            "server-authoritative-block-breaking=false"
        ]
    } else if (GetPlatform() === "java") {
        ConfigFile = join(bds_dir_java, "server.properties");
        Config = [
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
            "max-world-size=29999984"
        ]
    } else if (GetPlatform() === "pocketmine") {
        ConfigFile = join(bds_dir_pocketmine, "server.properties");
        Config = [
            "language=eng",
            `level-name=${JsonConfig.world}`,
            `motd=${JsonConfig.description}`,
            `server-port=${JsonConfig.port}`,
            `white-list=${(()=>{if (JsonConfig.whitelist === true) return "on";else return "off";})()}`,
            `max-players=${JsonConfig.players}`,
            `gamemode=${JsonConfig.gamemode}`,
            `difficulty=${(()=>{if (JsonConfig.difficulty === "easy") return 0;else if (JsonConfig.difficulty === "peaceful") return 1;else if (JsonConfig.difficulty === "normal") return 2;else if (JsonConfig.difficulty === "hard") return 3;else throw new Error("Difficulty error");})()}`,
            `xbox-auth=${(()=>{if (JsonConfig.account === true) return "on";else return "off";})()}`,
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
            "auto-save=on"
        ]
    }

    Config.push("")
    Config.push("")
    Config.push("# By The Bds Maneger project")
    fs.writeFileSync(ConfigFile, Config.join("\n"))
    return Config;
}
function bds_get_config(){
    var config;
    const JsonConfig = {};
    
    if (GetPlatform() === "bedrock") {
        config = propertiesToJSON(fs.readFileSync(path.join(bds_dir_bedrock, "server.properties"), "utf8"));
        
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
    else if (GetPlatform() === "java") {
        config = propertiesToJSON(fs.readFileSync(path.join(bds_dir_java, "server.properties"), "utf8"));
        
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
    else if (GetPlatform() === "pocketmine") {
        config = propertiesToJSON(fs.readFileSync(path.join(bds_dir_pocketmine, "server.properties"), "utf8"));
        
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
    return JsonConfig
}
function config_example(){
return {
        name: "Bedrock our Java",
        description: "BDS Maneger",
        gamemode: "survival",
        difficulty: "normal",
        player_permission: "member",
        xbox: true,
        white_list: false,
        cheats: false,
        players: 100,
        port: 19132,
        port6: 19133
    }
}
module.exports.config = bds_config
module.exports.get_config = bds_get_config
module.exports.config_example = config_example