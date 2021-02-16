module.exports.checkUser = (USERNAME) => {
    const fs = require("fs")
    const path = require("path")
    const bds = require("../index")
    const telegram_admin = path.join(bds.bds_dir, "telegram_admin.json")
    if (fs.existsSync(telegram_admin)) {
        var admins = fs.readFileSync(telegram_admin, "utf8");
    } else {
<<<<<<< HEAD
        var admins = `{"sh23_bot_not_config": {"allow": true}}`;
        console.warn("All allowed")
        console.log(`Create file in with name: ${require("../index").bds_dir}/telegram_admin.json`)
=======
        const config = {
            "sh23_bot_not_config": {
                "allow": true
            }
        }
        fs.writeFileSync(telegram_admin, JSON.stringify(config))
        throw new console.error(`we just created the telegram authorization, edit before using: ${config}`);
>>>>>>> main
    }
    var adm = JSON.parse(admins);
    for(let check_ in adm){
        if (USERNAME == check_){
            return true
<<<<<<< HEAD
        } else if (index == "sh23_bot_not_config"){
=======
        } else if (check_ == "sh23_bot_not_config"){
>>>>>>> main
            console.warn("Allow all")
            return true
        } check_++;
    }
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