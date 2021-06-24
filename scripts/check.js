const { GetServerBan, GetTelegramAdmins, GetPlatform } = require("../lib/BdsSettings");
module.exports.checkUser = (admin_name) => {
    var adm = GetTelegramAdmins();
    for(let check_ in adm){
        const admin_check = adm[check_]
        if (admin_name === admin_check || admin_check === "all_users") return true;
    }
    return false
}

module.exports.CheckBan = function (player){
    var players = GetServerBan();
    for(let check_ in players){
        const admin_check = players[check_]
        if (player === admin_check.username) {
            if (admin_check[GetPlatform()]) return true
        }
    }
    return false
}