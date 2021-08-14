#!/usr/bin/env node
const path = require("path");
process.env.Docker_Root = path.resolve(__dirname, "../");
(async () => {
    const Docker = require("docker-run_build");
    await Docker.Build();
    await Docker.Run();
})();