function bds_config(json_config){
    const bds = require("../index")
    const path = require("path")
    var fs = require("fs")

    if (bds.platform === "java") var Server_Config = path.join(bds.bds_dir_java, "server.properties");
    else var Server_Config = path.join(bds.bds_dir_bedrock, "server.properties");

    const cpuCount = require("os").cpus().length;
    
    if (2 < cpuCount - 2) var CPU = cpuCount - 2;
    else var CPU = cpuCount;
    
    if (json_config.includes(".json")){
        var config = JSON.parse(fs.readFileSync(json_config, "utf8"))
    } else var config = JSON.parse(json_config)

    if (config.description == undefined) var description_name = "Dedicated Server";
    else var description_name = config.description;

    // Level Name
    if (config.name == undefined) var level_name = "Bedrock level";
    else var level_name = config.name;

    // gamemode
    if (config.gamemode == undefined) var gamemode = "survival";
    else var gamemode = config.gamemode;

    // Difficulty
    if (config.difficulty == undefined) var difficulty = "easy";
    else var difficulty = config.difficulty;

    // cheats
    if (config.cheats == undefined) var allow_cheats = false;
    else var allow_cheats = config.cheats;

    // Maximo de Jogadores
    if (config.players == undefined) var max_players = 10;
    else var max_players = config.players;

    // Xbox authentication outside the internal network
    if (config.xbox == undefined) var online_mode = true;
    else var online_mode = config.xbox;

    // Whitelist
    if (config.white_list == undefined){var white_list = false;} else {var white_list = config.white_list;}

    // Server Port IPv4
    if (config.port == undefined){var server_port = 19132;} else {var server_port = config.port;}

    // Server Port IPv6
    if (config.port6 == undefined){var server_portv6 = 19133;} else {var server_portv6 = config.port6;}

    // Default player permission
    if (config.player_permission == undefined) var player_permission = "member";
    else var player_permission = config.player_permission;
    
    if (2 >= cpuCount) var tick = 2 ;
    else if (4 >= cpuCount) var tick = 4;
    else if (6 >= cpuCount) var tick = 6;
    else if (8 >= cpuCount) var tick = 8;
    else if (10 >= cpuCount) var tick = 10;
    else var tick = 12

/*Save Files*/
if (bds.platform === "bedrock"){
    var config_file_content = `server-name=${description_name}
gamemode=${gamemode}
difficulty=${difficulty}
allow-cheats=${allow_cheats}
max-players=${max_players}
online-mode=${online_mode}
white-list=${white_list}
server-port=${server_port}
server-portv6=${server_portv6}
view-distance=32
tick-distance=${tick}
player-idle-timeout=0
max-threads=${CPU}
level-name=${level_name}
level-seed=
default-player-permission-level=${player_permission}
texturepack-required=true
content-log-file-enabled=false
compression-threshold=1
server-authoritative-movement=server-auth
player-movement-score-threshold=20
player-movement-distance-threshold=0.3
player-movement-duration-threshold-in-ms=500
correct-player-movement=false

# Created on Bds-Manager by Sirherobrine23`
    
} else {
    var config_file_content = `enable-jmx-monitoring=false
rcon.port=25575
level-seed=
gamemode=${gamemode}
enable-command-block=${allow_cheats}
enable-query=true
generator-settings=
level-name=${level_name}
motd=${description_name}
query.port=${server_port}
pvp=true
generate-structures=true
difficulty=${difficulty}
network-compression-threshold=256
max-tick-time=60000
max-players=${max_players}
use-native-transport=true
online-mode=${online_mode}
enable-status=true
allow-flight=false
broadcast-rcon-to-ops=true
view-distance=32
max-build-height=256
server-ip=
allow-nether=true
server-port=${server_port}
enable-rcon=${allow_cheats}
sync-chunk-writes=true
op-permission-level=4
prevent-proxy-connections=false
resource-pack=
entity-broadcast-range-percentage=100
rcon.password=25as65d3
player-idle-timeout=0
force-gamemode=false
rate-limit=0
hardcore=false
white-list=${white_list}
broadcast-console-to-ops=true
spawn-npcs=true
spawn-animals=true
snooper-enabled=true
function-permission-level=2
level-type=default
text-filtering-config=
spawn-monsters=true
enforce-whitelist=false
resource-pack-sha1=
spawn-protection=16
max-world-size=29999984
#
# Created on Bds-Manager by Sirherobrine23`
}
// console.log(config_file_content);
fs.writeFileSync(Server_Config, config_file_content);
return "success"
}
function bds_get_config(){
    var fs = require("fs");
    const path = require("path")
    const bds = require("../index")
    const propertiesToJSON = require("properties-to-json");

    if (bds.platform === "bedrock") var config_path = path.join(bds.bds_dir_bedrock, "server.properties")
    else var config_path = path.join(bds.bds_dir_java, "server.properties")
    var config = fs.readFileSync(config_path, "utf8").split("-").join("_")
    return propertiesToJSON(config);
}
module.exports.config_example = () =>{
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