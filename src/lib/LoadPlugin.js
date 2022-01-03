const fs = require("fs");
const path = require("path");
const BdsSettings = require("./BdsSettings");

const ModD = {};
function LoadPlugins() {
  return fs.readdirSync(BdsSettings.ExternalPlugins).filter(file => fs.fstatSync(path.join(BdsSettings.ExternalPlugins, file)).isFile()).map(files => {
    try {
      return require(path.join(BdsSettings.ExternalPlugins, files));
    } catch (err) {
      console.log(err);
      return null;
    }
  }).filter(plugin => plugin);
}
ModD.LoadPlugins = LoadPlugins;

ModD.plugin = LoadPlugins();
fs.watch(BdsSettings.ExternalPlugins, () => {
  ModD.plugin = LoadPlugins();
});

module.exports = ModD;