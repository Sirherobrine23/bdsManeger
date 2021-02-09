function bds_config(json_config){
    const bds = require("../index")
    const path = require("path")
    var fs = require("fs")
    const cpuCount = require("os").cpus().length;

    var Server_Config;
    if (bds.platform === "java") Server_Config = path.join(bds.bds_dir_java, "server.properties");
    else Server_Config = path.join(bds.bds_dir_bedrock, "server.properties");

    var CPU
    if (2 < cpuCount - 2) CPU = cpuCount - 2;
    else CPU = cpuCount;

    var config;
    if (json_config.includes(".json")) config = JSON.parse(fs.readFileSync(json_config, "utf8"));
    else config = JSON.parse(json_config)

    // 
    var
    description_name = "Dedicated Server",
    level_name = "Bedrock level",
    gamemode = "survival",
    difficulty = "easy",
    allow_cheats = false,
    max_players = 10,
    online_mode = true,
    white_list = false,
    server_port = 19132,
    server_portv6 = 19133,
    player_permission = "member",
    tick = 0

    if (config.description !== undefined) description_name = config.description;

    if (config.name !== undefined) level_name = config.name;

    if (config.gamemode !== undefined) gamemode = config.gamemode;

    if (config.difficulty !== undefined) difficulty = config.difficulty;

    if (config.cheats !== undefined) allow_cheats = config.cheats;

    if (config.players !== undefined) max_players = config.players;

    if (config.xbox !== undefined) online_mode = config.xbox;

    if (config.white_list !== undefined) white_list = config.white_list;

    if (config.port !== undefined) server_port = config.port;

    if (config.port6 !== undefined) server_portv6 = config.port6;

    if (config.player_permission !== undefined) player_permission = config.player_permission;
    
    if (2 >= cpuCount) tick = 2 ;
    else if (4 >= cpuCount) tick = 4;
    else if (6 >= cpuCount) tick = 6;
    else if (8 >= cpuCount) tick = 8;
    else if (10 >= cpuCount) tick = 10;
    else tick = 12

/*Save Files*/
var config_file_content
if (bds.platform === "bedrock"){
    config_file_content = `server-name=${description_name}
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
    config_file_content = `enable-jmx-monitoring=false
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
return true
}
function bds_get_config(){
    var fs = require("fs");
    const path = require("path");
    const bds = require("../index");
    const propertiesToJSON = require("properties-to-json");

    var config_path;
    if (bds.platform === "bedrock") config_path = path.join(bds.bds_dir_bedrock, "server.properties");
    else config_path = path.join(bds.bds_dir_java, "server.properties");
    var config = fs.readFileSync(config_path, "utf8").split("-").join("_");
    return propertiesToJSON(config);
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