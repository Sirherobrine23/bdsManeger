const child_process = require("child_process");
function commdExist(command){
  if (process.platform === "linux" || process.platform === "darwin" || process.platform === "android") {
    try {
      child_process.execSync(`command -v ${command}`);
      return true
    } catch (error) {
      return false
    }
  } else if (process.platform === "win32") {
    try {
      child_process.execSync(`where ${command} > nul 2> nul`);
      return true
    } catch (error) {
      return false
    }
  }
  throw new Error(`Platform ${process.platform} not supported`);
}

module.exports = commdExist
module.exports.sync = commdExist
