function bds_config(json_config){
const Server_Config = `${require("../index").server_dir}/server.properties`
const cpuCount = require('os').cpus().length;
var fs = require("fs")
if (2 < cpuCount - 2) var CPU = cpuCount - 2; else var CPU = cpuCount;
if (json_config.includes('.json')){
    var config = JSON.parse(fs.readFileSync(json_config, 'utf-8'))
} else
    var config = JSON.parse(json_config)
// const config = json_storage/*JSON.parse(json_storage)*/
// Definitions
//
// var nothing = '';
// description
if (config.description == undefined){
    var description_name = `Dedicated Server`;
} else {
    var description_name = config.description;
};

// Level Name
if (config.name == undefined){
    var level_name = `Bedrock level`;
} else {
    var level_name = config.name;
};

// gamemode
if (config.gamemode == undefined){
    var gamemode = `survival`;
} else {
    var gamemode = config.gamemode;
};

// Difficulty
if (config.difficulty == undefined){
    var difficulty = `easy`;
} else {
    var difficulty = config.difficulty;
};

// cheats
if (config.cheats == undefined){
    var allow_cheats = false;
} else {
    var allow_cheats = config.cheats;
};

// Maximo de Jogadores
if (config.players == undefined){
    var max_players = 10;
} else {
    var max_players = config.players;
};

// Xbox authentication outside the internal network
if (config.xbox == undefined){
    var online_mode = true;
} else {
    var online_mode = config.xbox;
};

// Whitelist
if (config.white_list == undefined){
    var white_list = false;
} else {
    var white_list = config.white_list;
};

// Server Port IPv4
if (config.port == undefined){
    var server_port = 19132;
} else {
    var server_port = config.port;
};

// Server Port IPv6
if (config.port6 == undefined){
    var server_portv6 = 19133;
} else {
    var server_portv6 = config.port6;
};

// Default player permission
if (config.player_permission == undefined){
    var player_permission = `member`;
} else {
    var player_permission = config.player_permission;
};
const cpuCountTick = require('os').cpus().length;
if (2 >= cpuCountTick)
    var tick = 2
else if (4 >= cpuCountTick)
    var tick = 4
else if (6 >= cpuCountTick)
    var tick = 6
else if (8 >= cpuCountTick)
    var tick = 8
else if (10 >= cpuCountTick)
    var tick = 10
else 
    var tick = 12
// end
//
/*Save Files*/
var config_file_content = `
server-name=${description_name}
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

# Created on Bds-Manager by Sirherobrine23
`
// console.log(config_file_content);
fs.writeFileSync(Server_Config, config_file_content);
return config_file_content
};
function bds_get_config(){
    var fs = require("fs");
    const propertiesToJSON = require("properties-to-json");
    const Server_Config = `${require("../index").server_dir}/server.properties`;
    const inGET = fs.readFileSync(Server_Config, "utf-8").replaceAll('-','_');
    return propertiesToJSON(inGET);
};
module.exports.config_example = () =>{
const example = `{
    "name": "Bedrock"
    "description": "Hello Works"
    "gamemode": "survival"
    "difficulty": "hard"
    "cheats": false
    "players": 100
    "xbox": true
    "white_list": false
    "port": 19132
    "port6": 19133
    "player_permission": "member"
}`
return example
}
module.exports.config = bds_config
module.exports.get_config = bds_get_config