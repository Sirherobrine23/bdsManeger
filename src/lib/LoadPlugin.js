const fs = require("fs");
const path = require("path");
const BdsSettings = require("./BdsSettings");

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

module.exports.plugin = LoadPlugins();
fs.watch(BdsSettings.ExternalPlugins, () => {
  module.exports.plugin = LoadPlugins();
});

module.exports.LoadPlugins = LoadPlugins;