const bds = require("../index")
module.exports.checkUser = (admin_name) => {
    var adm = bds.bds_config.telegram_admin;
    for(let check_ in adm){
        const admin_check = adm[check_]
        if (admin_name === admin_check)return true
        else if (admin_check === "all_users") return true
    }
    return false
}

module.exports.CheckBan = function (player){
    var players = bds.bds_config.bds_ban;
    for(let check_ in players){
        const admin_check = players[check_]
        if (player === admin_check) return true
        else if (admin_check === "all_users") return true
    }
    return false
}