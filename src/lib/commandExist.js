const child_process = require("child_process");

function commdExistSync(command = ""){
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

async function commdExistAsync(command = ""){
  let result = false;
  result = await new Promise((resolve, reject) => {
    if (process.platform === "linux" || process.platform === "darwin" || process.platform === "android") {
      child_process.exec(`command -v ${command}`, (error) => {
        if (error) return resolve(false);
        else return resolve(true);
      });
    } else if (process.platform === "win32") {
      child_process.exec(`where ${command} > nul 2> nul`, (error) => {
        if (error) return resolve(false);
        else return resolve(true);
      });
    } else return reject(new Error(`Platform ${process.platform} not supported`));
  });
  return result;
}

module.exports.commdExistSync = commdExistSync;
module.exports.commdExistAsync = commdExistAsync;

