const { execSync } = require("child_process");
const { readdirSync, existsSync } = require("fs");

function commdExist(command){
  if (process.platform === "linux" || process.platform === "darwin" || process.platform === "android") {try {execSync(`command -v ${command}`);return true} catch (error) {return false}}
  else if (process.platform === "win32") {try {execSync(`where ${command} > nul 2> nul`);return true} catch (error) {return false}}
  throw new Error(`Platform ${process.platform} not supported`);
}

module.exports = commdExist
module.exports.sync = commdExist
