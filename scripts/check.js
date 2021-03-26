module.exports.checkUser = (admin_name) => {
    const bds = require("../index")
    var adm = bds.bds_config.telegram_admin;
    for(let check_ in adm){
        const admin_check = adm[check_]
        if (admin_name === admin_check)return true
        else if (admin_check === "all_users") return true
    }
    return false
}