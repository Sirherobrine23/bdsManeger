#!/usr/bin/env node
"use strict";
process.env.IS_BIN_BDS = true
const bds = require("../index")
const readline = require("readline");
// const {bds_dir, bds_dir_bedrock, bds_dir_java} = require("../index")
bds.kill()
var argv = require("minimist")(process.argv.slice(2));
const {existsSync} = require("fs")
const {join} = require("path")
const bds_config = bds.bds_config
process.title = "Bds-Maneger";
if (argv.h || argv.help) {
  console.log([
    "usage: bds_maneger [options]",
    "",
    "options:",
    "  -p --platform        Select server platform",
    "  -V --server_version  server version to install, default \"latest\"",
    "  -h --help            Print this list and exit.",
    "  -v --version         Print the version and exit."
  ].join("\n"));
  process.exit();
}

var server =  (argv.p || argv.platform );
var version = (argv.v || argv.version);
var bds_version = (argv.V || argv.server_version);
if (version) {
  console.info("Bds Maneger core with version " + require("../package.json").version);
  process.exit();
}
if (server) {
  console.log(server);
  try {
    if (server === "JAVA"||server === "java") {bds.change_platform("java");bds.platform="java"}
    else if (server === "BEDROCK"||server === "bedrock") {bds.change_platform("bedrock");bds.platform="bedrock"}
    else if (server === "") {bds.change_platform("bedrock");bds.platform="bedrock"}
    else console.warn("Invalid platform, supported platforms are java and bedrock")
  } finally {
    process.exit()
  }
}

// check is installed
var server_exec;
if (bds_config.bds_platform === "bedrock") {var file; if (process.platform === "linux") file = "bedrock_server"; else file = "bedrock_server.exe"; server_exec = join(bds.bds_dir_bedrock, file)}
else server_exec = join(bds.bds_dir_java, "server.jar");
if (!(existsSync(server_exec))) {
  console.warn("Installing the latest version of the server, anything you can install with bds_maneger -V [version], wait ...");
  bds_version = "latest"
}

if (bds_version){
  try {
    process.env.BDS_DOCKER_IMAGE = true
    bds.download(bds_version)
  } catch (error) {
    console.error(error)
    process.exit(165)
  }
}
else {
  console.info("Send a \"stop\" command to stop the server and exit")
  console.info("Use CTRL + C to force exit")
  const bds_server = bds.start()
  bds_server.stdout.on("data", function (data){
    console.log(data)
  })
  bds_server.on("exit", function (code){
    console.log("leaving the server")
    process.exit(code)
  })
  bds.api()
}
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
rl.on("line", (input) => {
  bds.command(input)
  if (input === "stop") {
    rl.close()
    console.log("------------------------ Going out ------------------------")
  }
  else console.log("------------------------------------------------");
});
