const express = require("express");
const app = express.Router();
module.exports = app;
const BdsSettings = require("../lib/BdsSettings");
const BdsServerPlugins = require("../PluginManeger");

// List
app.get("/", async (req, res) => {
  try {
    const { Platform = BdsSettings.CurrentPlatorm() } = req.query;
    const PluginList = await (BdsServerPlugins.PluginManeger(Platform)).listVersions();
    return res.json(PluginList);
  } catch (err) {
    return res.status(500).json({
      error: String(err.stack || err).split(/\r\n|\n/gi)
    });
  }
});

app.post("/", async (req, res) => {
  const { Platform = BdsSettings.CurrentPlatorm(), Plugin = "", Version = "latest" } = req.body;
  try {
    const PluginList = await (BdsServerPlugins.PluginManeger(Platform)).listVersions();
    const FiltedVersionsAndPlugins = (PluginList.filter(PluginName => PluginName.name === Plugin))[0].versions.filter((Plugin, PluginIndex) => {
      if (Version === "latest") {
        if (PluginIndex === 0) {
          return true;
        }
      } else {
        if (Plugin.version === Version) {
          return true;
        }
      }
    });
    if (FiltedVersionsAndPlugins.length === 0) return res.status(400).json({
      error: "Plugin not found or Version not found"
    });
    const PluginVersion = FiltedVersionsAndPlugins[0];
    return res.json({
      Path: await (BdsServerPlugins.PluginManeger(Platform)).Install(Plugin, PluginVersion.version)
    });
  } catch (err) {
    return res.status(500).json({
      error: String(err.stack || err).split(/\r\n|\n/gi)
    });
  }
});