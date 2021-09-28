#!/usr/bin/env node
const path = require("path");
process.env.Docker_Root = path.resolve(__dirname, "../");
const Docker = require("docker-run_build");
Docker.Build().then(() => {
    Docker.Run().catch((e) => {
        console.log(e);
        process.exit(2);
    });
}).catch(e => {
    console.log(e);
    process.exit(1);
});