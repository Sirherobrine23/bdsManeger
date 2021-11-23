const fs = require("fs");
const BdsSettings = require("../lib/BdsSettings");

function CreatePlayerJson(data = "", callback = (d = [{Player: "", Action: "connect", Platform: "", xuid: "", Date: new Date()},{Player: "", Action: "disconnect", Platform: "", xuid: "", Date: new Date()}]) => console.log(d)){
  const Current_platorm = BdsSettings.GetPlatform();
  // Bedrock
  if (Current_platorm === "bedrock") {
    // "[INFO] Player connected: Sirherobrine, xuid: 2535413418839840",
    // "[INFO] Player disconnected: Sirherobrine, xuid: 2535413418839840",
    const BedrockMap = data.split(/\n|\r/gi).map(line => {
      if (line.includes("connected")) {
        let SplitLine = line.replace(/\[.+\]\s+Player/gi, "").trim().split(/\s+/gi);
        let Actions = "";
        if (/^disconnected/.test(SplitLine[0].trim())) Actions = "disconnect"; else Actions = "connect";

        // Object Map
        const ObjectReturn = {
          Player: line.replace(/^.*connected:/gi, "").replace(/, xuid:.*$/gi, "").trim(),
          Action: Actions,
          Platform: Current_platorm,
          xuid: line.replace(/^.*,.*xuid:/gi, "").trim(),
          Date: new Date()
        }

        // Return
        return ObjectReturn
      } else return false;
    }).filter(a=>a);
    return callback(BedrockMap);
  }
  // Java and Pocketmine-MP
  else if (Current_platorm === "java" || Current_platorm === "pocketmine") {
    const JavaMap = data.split(/\n|\r/gi).map(line => {
      if (line.trim().includes("joined the game") || line.includes("left the game")) {
        line = line.replace(/^\[.+\] \[.+\/.+\]:/, "").trim();
        let Actions = "";
        if (/joined/.test(line)) Actions = "connect";
        else if (/left/.test(line)) Actions = "disconnect";
        else Actions = null;

        // Player Object
        const JavaObject = {
          Player: line.replace(/joined the game|left the game/gi, "").trim(),
          Action: Actions,
          Platform: Current_platorm,
          Date: new Date()
        }

        // Return JSON
        return JavaObject
      } else return false;
    }).filter(a=>a);
    return callback(JavaMap);
  }
}
module.exports.CreatePlayerJson = CreatePlayerJson;

function UpdateUserJSON(New_Object = []){
  const Player_Json_path = BdsSettings.GetPaths("player");
  const Current_platorm = BdsSettings.GetPlatform();
  let Players_Json = [
    {
      Player: "Steve",
      Action: "connect",
      Platform: Current_platorm,
      Date: new Date()
    }
  ];
  Players_Json = [];
  if (fs.existsSync(Player_Json_path)) Players_Json = JSON.parse(fs.readFileSync(Player_Json_path, "utf8"));
  if (typeof Players_Json.map !== "function") {
    let OldPlayers_Json = Players_Json;
    Players_Json = [];
    OldPlayers_Json.bedrock.forEach(a=>Players_Json.push({
      Player: a.Player,
      Action: a.Action,
      Platform: "bedrock",
      Date: a.Date
    }));
    OldPlayers_Json.java.forEach(a=>Players_Json.push({
      Player: a.Player,
      Action: a.Action,
      Platform: "java",
      Date: a.Date
    }));
    OldPlayers_Json.pocketmine.forEach(a=>Players_Json.push({
      Player: a.Player,
      Action: a.Action,
      Platform: "pocketmine",
      Date: a.Date
    }));
  }
  // Array
  Players_Json = Players_Json.concat(New_Object)

  fs.writeFileSync(Player_Json_path, JSON.stringify(Players_Json, null, 2));
  return Players_Json;
}
module.exports.UpdateUserJSON = UpdateUserJSON;

// Search player in JSON
module.exports.Player_Search = function Player_Search(player = "dontSteve") {
  const Player_Json_path = BdsSettings.GetPaths("player");
  const Players_Json = JSON.parse(fs.readFileSync(Player_Json_path, "utf8"))
  for (let Player of Players_Json) {
    if (Player.Player === player.trim()) return Player;
  }
  return {};
}
