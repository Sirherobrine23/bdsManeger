# Bds Maneger Core

A quick and simple way to create and manage Minecraft servers like `Bedrock`, `Java`, `Paper`, `Spigot`, `Pocketmine-MP` and `Powernukkit`.

## Requeriments

- Nodejs (`16^`).
- linux/Windows/Macos.

## Wiki

We are moving the documentation [here](https://wiki.bdsmaneger.sirherobrine23.org/).

## Example

With yargs and cli-color ([This is the cli](https://github.com/The-Bds-Maneger/bds-cli)).

```typescript
#!/usr/bin/env node
import readline from "node:readline";
import yargs from "yargs";
import cliColors from "cli-color";
import * as BdsCore from "@the-bds-maneger/core";

// type currentPlatform = "Bedrock"|"Java"|"Spigot"|"PocketmineMP"|"Powernukkit";
const Yargs = yargs(process.argv.slice(2)).help().version(false).alias("h", "help").wrap(yargs.terminalWidth());

// Bds import/export
Yargs.command("import", "import from another computer", async yargs => {
  const options = yargs.options("host", {
    type: "string"
  }).options("port", {
    type: "number"
  }).option("authToken", {
    type: "string",
    demandOption: true,
    required: true
  }).parseSync();
  return BdsCore.importBds({host: options.host, port: options.port, authToken: options.authToken});
}).command("export", "Export bds root folder", async yargs => {
  const opts = yargs.option("port", {
    type: "number",
    description: "listen port server, default is random"
  }).parseSync();
  const server = new BdsCore.exportBds();
  await server.listen(opts.port);
  return server.waitClose();
});

const addPlatform = (Yargs) => Yargs.option("platform", {
  alias: "P",
  description: "Select Bds Maneger core platform",
  demandOption: true,
  type: "string",
  choices: [
    "Bedrock",
    "Java",
    "Spigot",
    "PocketmineMP",
    "Powernukkit",
    "Paper"
  ]
});

// Install Server
Yargs.command("install", "Download and Install server", yargs => {
  addPlatform(yargs);
  const options = yargs.option("version", {alias: "v", description: "Server version", default: "latest"}).parseSync();
  if (options.platform === "Bedrock") return BdsCore.Bedrock.installServer(options.version);
  else if (options.platform === "Java") return BdsCore.Java.installServer(options.version);
  else if (options.platform === "Spigot") return BdsCore.Spigot.installServer(options.version);
  else if (options.platform === "Paper") return BdsCore.PaperMC.installServer(options.version);
  else if (options.platform === "PocketmineMP") return BdsCore.PocketmineMP.installServer(options.version);
  else if (options.platform === "Powernukkit") return BdsCore.Powernukkit.installServer(options.version);
  throw new Error("Invalid platform");
});

// Start Server
Yargs.command("run", "Start server", async yargs => {
  addPlatform(yargs);
  const options = yargs.option("javaMaxMemory", {alias: "M", type: "number"}).option("javaAllFreeMem", {alias: "F", type: "boolean", default: true, description: "Use all free memory to run Java server"}).option("installGeyser", {alias: "g", type: "boolean", description: "Install geyser plugin to supported servers"}).parseSync();
  let server: BdsCore.globalPlatfroms.actions;
  if (options.platform === "Bedrock") server = await BdsCore.Bedrock.startServer();
  else if (options.platform === "Java") server = await BdsCore.Java.startServer({maxMemory: options.javaMaxMemory});
  else if (options.platform === "Spigot") server = await BdsCore.Spigot.startServer({maxMemory: options.javaMaxMemory, maxFreeMemory: options.javaAllFreeMem, pluginList: options.installGeyser ? ["Geyser"]:undefined});
  else if (options.platform === "Paper") server = await BdsCore.PaperMC.startServer({maxMemory: options.javaMaxMemory, maxFreeMemory: options.javaAllFreeMem, pluginList: options.installGeyser ? ["Geyser"]:undefined});
  else if (options.platform === "PocketmineMP") server = await BdsCore.PocketmineMP.startServer();
  else if (options.platform === "Powernukkit") server = await BdsCore.Powernukkit.startServer({maxMemory: options.javaMaxMemory});
  else throw new Error("Invalid platform");
  server.on("log_stderr", data => console.log(cliColors.redBright(data)));
  server.on("log_stdout", data => console.log(cliColors.greenBright(data)));
  server.once("serverStarted", () => {
    let log = "";
    server.portListening.forEach(port => {
      log += `Port listen: ${port.port}\n${"\tTo: "+(port.plugin === "geyser"?"Bedrock":(port.plugin||options.platform)+"\n")}`;
    });
    console.log(log.trim());
    console.log(cliColors.yellowBright("Commands inputs now avaible"))
    const line = readline.createInterface({input: process.stdin, output: process.stdout});
    line.on("line", line => server.runCommand(line));
    line.once("SIGINT", () => server.stopServer());
    line.once("SIGCONT", () => server.stopServer());
    line.once("SIGTSTP", () => server.stopServer());
    server.once("exit", () => line.close());
  });
  return server.waitExit();
});

// Plugin maneger
// Yargs.command("plugin", "Plugin maneger", yargs=>yargs.command("install", "Install plugin", yargs => yargs, () => {}).command({command: "*", handler: () => {Yargs.showHelp();}}), ()=>{});

Yargs.command({command: "*", handler: () => {Yargs.showHelp();}}).parseAsync();
```
