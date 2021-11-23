const BdsSettings = require("../lib/BdsSettings");
const child_process = require("child_process");

module.exports.BasicCommands = function BasicCommands(ServerExec = child_process.exec("exit 0")) {
  const CurrentBdsPlatform = BdsSettings.GetPlatform();
  const stop = function (){
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write("stop\n");
      return "stop";
    } else if (CurrentBdsPlatform === "dragonfly") {
      ServerExec.kill("SIGKILL");
      return "process";
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write("stop\n");
      return "stop";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write("stop\n");
      return "stop";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write("stop\n");
      return "stop";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const op = function (player = "Steve") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`op "${player}"\n`);
      return "op";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`op ${player}\n`);
      return "op";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`op ${player}\n`);
      return "op";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`op ${player}\n`);
      return "op";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const deop = function (player = "Steve") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`deop "${player}"\n`);
      return "deop";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`deop ${player}\n`);
      return "deop";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`deop ${player}\n`);
      return "deop";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`deop ${player}\n`);
      return "deop";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const ban = function (player = "Steve") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`kick "${player}"\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`ban ${player}\n`);
      return "ban";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`ban ${player}\n`);
      return "ban";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`ban ${player}\n`);
      return "ban";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const kick = function (player = "Steve", text = "you got kicked") {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`kick "${player}" ${text}\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`kick ${player} ${text}\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`kick ${player} ${text}\n`);
      return "kick";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`kick ${player} ${text}\n`);
      return "kick";
    } else throw new Error("Bds Core Bad Config Error");
  };
  const tp = function (player = "Steve", cord = {x: 0, y: 128, z: 0}) {
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`tp ${player} ${cord.x} ${cord.y} ${cord.z}\n`);
      return "tp";
    } else throw new Error("Bds Core Bad Config Error");
  };
  function say(text = ""){
    if (CurrentBdsPlatform === "bedrock") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else if (CurrentBdsPlatform === "dragonfly") {
      throw new Error("Dragonfly does not support commands");
    } else if (CurrentBdsPlatform === "java") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else if (CurrentBdsPlatform === "pocketmine") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else if (CurrentBdsPlatform === "spigot") {
      ServerExec.stdin.write(`say ${text}\n`);
      return "say";
    } else throw new Error("Bds Core Bad Config Error");
  }
  return { stop, op, deop, ban, kick, tp, say };
}
