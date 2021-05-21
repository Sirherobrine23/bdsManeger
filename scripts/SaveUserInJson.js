const bds = require("../index")
const {CheckBan} = require("./check");
const fs = require("fs");

function MytypeKill(player) {
    console.warn(`Player ${player} tried to connect to the server`)
    let removeUser = `tp "${player}" ~ ~9999999999999999999999999 ~`
    console.log(removeUser);
    var RemoveUser = setInterval(() => {
        bds.command(removeUser);
        bds_server_string.stdout.on("data", (data) => {
            if (data.includes("disconnected:")) {
                if (data.includes(player)) clearInterval(RemoveUser);
            }
        })
        
    }, 6 * 1000);
    return RemoveUser;
}

function Bedrock(data){
    const file_users = fs.readFileSync(bds.players_files, "utf8");
    const users = JSON.parse(file_users);
    const CurrentData = new Date();
    for (let line of data.split(/\r?\n/g)) {
        if (line.includes("connected:")) {
            line = line.replace("[INFO] Player ", "").trim()
            let GetSatatus = line.trim().split(/\s+/g)[0];
            const GetUser = [];
            for (let index of line.trim().replace("connected:", "").replace("dis", "").trim().split(", xuid:")) if (index !== "") GetUser.push(index.trim());
            // -------------------------------------------------
            var username = GetUser[0];
            console.log(GetUser);
            // User Connected
            if (GetSatatus === "connected:") {
                if (CheckBan(username)) MytypeKill(username)
                else if (users.bedrock[username] === undefined) {
                    var xuid = GetUser[1];
                    users.bedrock[username] = {
                        date: CurrentData,
                        connected: true,
                        xboxID: xuid,
                        update: [
                            {
                                date: CurrentData,
                                connected: true,
                            }
                        ]
                    }
                } else {
                    users.bedrock[username].connected = true
                    users.bedrock[username].date = CurrentData
                    users.bedrock[username].update.push({
                        date: CurrentData,
                        connected: true,
                    })
                }
            }
            // User Disconnected
            else if (GetSatatus === "disconnected:") {
                if (!(CheckBan(username))){
                    users.bedrock[username].connected = false
                    users.bedrock[username].date = CurrentData
                    users.bedrock[username].update.push({
                        date: CurrentData,
                        connected: false,
                    })
                }
            }
        }
    }
    fs.writeFileSync(bds.players_files, JSON.stringify(users, null, 2))
    if (users.bedrock[username]) return true
    else return false
}

function Pocketmine(data){
    const UTF8Users = fs.readFileSync(bds.players_files, "utf8");
    const users = JSON.parse(UTF8Users);
    const CurrentData = new Date();

    // Init
    for (let line of data.split(/\r?\n/g)) {
        line = line.replace(/\[[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\] \[Server thread\/INFO\]: /, "").trim();
        const currenttosave = {
            username: line.replace(/\[[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\] \[Server thread\/INFO\]: /, "").trim().replace("joined the game", "").trim().replace("left the game", "").trim(),
            join: line.includes("joined"),
            left: line.includes("left")
        }
        if (currenttosave.join){
            const username = currenttosave.username;
            if (users.pocketmine[username]) {
                users.pocketmine[username].connected = true
                users.pocketmine[username].date = CurrentData
                users.pocketmine[username].update.push({
                    date: CurrentData,
                    connected: true,
                })
            } else {
                users.pocketmine[username] = {
                    connected: true,
                    date: CurrentData,
                    update: [
                        {
                            date: CurrentData,
                            connected: true,
                        }
                    ]
                }
            }
        }
        else if (currenttosave.left){
            const username = currenttosave.username;
            if (users.pocketmine[username]) {
                users.pocketmine[username].connected = false
                users.pocketmine[username].date = CurrentData
                users.pocketmine[username].update.push({
                    date: CurrentData,
                    connected: false,
                })
            }
        }
    }
    console.log(users);
    fs.writeFileSync(bds.players_files, JSON.stringify(users, null, 2))
    return users
}

module.exports = function (data){
    if (bds.platform === "bedrock") return Bedrock(data);
    else if (bds.platform === "java") return false;
    else if (bds.platform === "pocketmine") return Pocketmine(data);
    else if (bds.platform === "jsprismarine") return false
    else throw new Error("Plafotform Error !!")
};