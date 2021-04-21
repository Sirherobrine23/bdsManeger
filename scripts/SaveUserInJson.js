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

const Bedrock = function (data){
    data = data.split(/\r?\n/g)
    const file_users = fs.readFileSync(bds.players_files, "utf8");
    const users = JSON.parse(file_users);
    
    for (let line of data)
        if (line.includes("connected:")) {
            line = line.replace("[INFO] Player ", "")
            
            let GetSatatus = line.trim().split(/\s+/g)[0]
            console.log(GetSatatus);
            var Connected, Disconnected;
            // Connected in bedrock server
            if (GetSatatus === "connected:") Connected = true;
            // Disconeccted in bedrock server
            else if (GetSatatus === "disconnected:") Disconnected = true;
            else throw new Error("Log Error")
            
            const CurrentData = new Date();
            const GetValue = [];for (let index of line.trim().replace("connected:", "").replace("dis", "").trim().split(", xuid:")) if (index !== "") GetValue.push(index.trim());
            // -------------------------------------------------
            var username = GetValue[0];
            console.log(GetValue);
            // User Connected
            if (Connected) {
                //------------------
                if (CheckBan(username)) MytypeKill(username)
                else if (users[username] === undefined) users[username] = {
                    date: CurrentData,
                    connected: true,
                    update: [
                        {
                            date: CurrentData,
                            connected: true,
                        }
                    ]
                }; else {
                    users[username].connected = true
                    users[username].date = CurrentData
                    users[username].update.push({
                        date: CurrentData,
                        connected: true,
                    })
                }
            }
            // User Disconnected
            else if (Disconnected) {
                users[username].connected = false
                users[username].date = CurrentData
                users[username].update.push({
                    date: CurrentData,
                    connected: false,
                })
            }
        }
    fs.writeFileSync(bds.players_files, JSON.stringify(users, null, 2))
    return
}

module.exports = function (data){
    if (bds.platform === "bedrock") return Bedrock(data);
    else if (bds.platform === "java") return false;
    else if (bds.platform === "pocketmine") return false
    else throw new Error("Plafotform Error !!")
};