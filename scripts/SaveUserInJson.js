const bds = require("../index")
const {CheckBan} = require("./check");
const fs = require("fs")

function KickPlayer(player){
    console.warn(`Player ${player} tried to connect to the server`)
    let removeUser = `kick "${player}" Player banned: ${player}`
    console.log(removeUser);
    var stared_ban = setInterval(() => {
        bds.command(removeUser)
        const detect_exit = bds_log_string.split("\n")
        for (let index in detect_exit) {
            const element = detect_exit[index];
            // Player disconnected: Steve alex,
            if (element.includes("Player disconnected:")) {
                if (element.includes(removeUser)) {
                    clearInterval(stared_ban)
                    clearInterval(stared_ban)
                    clearInterval(stared_ban)
                    clearInterval(stared_ban)
                    clearInterval(stared_ban)
                }
            }
        }
    }, 5 * 1000);
}

const bedrock = function (data){
    data = data.split("\n")
    var username;
    for (let line in data){
        const value = data[line].split(" ")
        // const list_player = value
        const status = value[2]
        if (status === "connected:"){
            if (value[3].includes(",")) username = value[3]
            else username = `${value[3]} ${value[4]}`
            if (username.slice(-1) === ",") username = username.slice(0, -1)
            //------------------
            if (CheckBan(username)) KickPlayer(username)
            else {
                console.log("Server Username connected: "+username);
                const file_users = fs.readFileSync(bds.players_files, "utf8");
                const users = JSON.parse(file_users)
                if (file_users.includes(username)){
                    for (let rem in users){
                        if (users[rem].player === username) {
                            users[rem].connected = true
                            users[rem].date = new Date()
                            users[rem].update.push({
                                date: new Date(),
                                connected: true
                            })
                        }
                    }
                } else users.push({
                    player: username,
                    date: new Date(),
                    connected: true,
                    update: [
                        {
                            date: new Date(),
                            connected: true,
                        }
                    ]
                })
                fs.writeFileSync(bds.players_files, JSON.stringify(users, null, 2))
            }
            
        } else if (status === "disconnected:"){
            if (value[3].includes(",")) username = value[3]
            else username = `${value[3]} ${value[4]}`
            if (username.slice(-1) === ",") username = username.slice(0, -1)
            console.log("Server Username disconnected: "+username);
            const users = JSON.parse(fs.readFileSync(bds.players_files, "utf-8"))
            for (let rem in users){
                if (users[rem].player === username) {
                    users[rem].connected = false
                    users[rem].date = new Date()
                    users[rem].update.push({
                        date: new Date(),
                        connected: false
                    })
                }
            }
            fs.writeFileSync(bds.players_files, JSON.stringify(users, null, 2))
        }
    }
    return data
}

const java = function (data){
    return data
}

const pocketmine = function (data){
    return data
}

module.exports.bedrock = bedrock
module.exports.java = java
module.exports.pocketmine = pocketmine
