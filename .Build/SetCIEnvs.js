const version = require("./package.json").version;
const ActionsCore = require("@actions/core");
console.log(version);
ActionsCore.exportVariable("BdsCoreVersion", version);