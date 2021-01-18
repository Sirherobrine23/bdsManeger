module.exports.checkUser = (USERNAME) => {
    const fs = require("fs")
    if (fs.existsSync(`${require("../index").bds_dir}/telegram_admin.json`)) {
        var admins = fs.readFileSync(`${require("../index").bds_dir}/telegram_admin.json`, "utf-8");
    } else {
        var admins = `{"sh23_bot_not_config": {"allow": true}}`;
        console.log("All allowed")
    }
    var adm = JSON.parse(admins);
    for(index in adm){
        if (USERNAME == index){
            return true
        } else if (index == "sh23_bot_not_config"){
            console.log("Allow all")
            return true
        }; index++;
    };
    return false
}

/* Anotações:
var adm = JSON.parse(admins);
for(index in adm){
    if (user == index){
        var adm2 = `adm.${index}.allow`
    } else if (index == "sh23_bot_not_config"){
        var adm2 = `adm.${index}.allow`};
        index++;
    };
*/
/* */
// module.exports = {
//     check: checkUser
// }