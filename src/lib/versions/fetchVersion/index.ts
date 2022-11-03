#!/usr/bin/env node
import yargs from "yargs";
import bedrock from "./Bedrock";
import pocketmine from "./Pocketmine";
import java from "./Java";
import spigot from "./Spigot";
import paper from "./Paper";
import powernukkit from "./Powernukkit"

const options = yargs(process.argv.slice(2)).help().version(false).alias("h", "help").wrap(yargs.terminalWidth()).options("all", {
  description: "Fetch all plaftorms",
  type: "boolean"
}).option("bedrock", {
  description: "Fetch Bedrock versions",
  type: "boolean"
}).option("java", {
  description: "Fetch Java versions",
  type: "boolean"
}).option("pocketmine", {
  description: "Fetch Pocketmine-MP versions",
  type: "boolean"
}).option("spigot", {
  description: "Fetch Spigot versions",
  type: "boolean"
}).option("paper", {
  description: "Fetch Paper versions",
  type: "boolean"
}).option("powernukkit", {
  description: "Fetch Powernukkit versions",
  type: "boolean"
})
.parseSync();

async function all() {
  await bedrock()
  await java();
  await pocketmine();
  await spigot();
  await paper();
  await powernukkit();
}

if (options.bedrock) bedrock().then(() => {console.log("Bedrock sucess update"); process.exit(0)}).catch(err => {console.log("Bedrock catch Error: %s", String(err)); process.exit(1)});
else if (options.java) java().then(() => {console.log("Java sucess update"); process.exit(0)}).catch(err => {console.log("Java catch Error: %s", String(err)); process.exit(1)});
else if (options.spigot) spigot().then(() => {console.log("Spigot sucess update"); process.exit(0)}).catch(err => {console.log("Spigot catch Error: %s", String(err)); process.exit(1)});
else if (options.pocketmine) pocketmine().then(() => {console.log("Pocketmine sucess update"); process.exit(0)}).catch(err => {console.log("Pocketmine catch Error: %s", String(err)); process.exit(1)});
else if (options.paper) paper().then(() => {console.log("Paper sucess update"); process.exit(0)}).catch(err => {console.log("Paper catch Error: %s", String(err)); process.exit(1)});
else if (options.powernukkit) powernukkit().then(() => {console.log("Powernukkit sucess update"); process.exit(0)}).catch(err => {console.log("Powernukkit catch Error: %s", String(err)); process.exit(1)});
else if (options.all) all().then(() => process.exit(0)).catch(err => {console.trace(err); process.exit(1)});
else {
  console.log("No options set");
  process.exit(1);
}