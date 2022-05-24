import * as server from "./server";
export const name = "startServer";
export const depends = "installServer";

export async function java() {
  console.log("Starting java server...");
  const session = await server.Start("java");
  session.log.on("all", console.log);
  await new Promise(res => {
    session.server.once("started", (date: Date) => {
      console.log("java started at", date);
      console.log("Stoping java");
      res("");
    });
  });
  return session.commands.stop();
}

export async function pocketmine() {
  console.log("Starting pocketmine server...");
  const session = await server.Start("pocketmine");
  session.log.on("all", console.log);
  session.log.on("all", data => {
    // [*] PocketMine-MP set-up wizard
    if (/set-up\s+wizard/.test(data)) {
      console.log("Auto setup wizard");
      session.commands.execCommand("eng").execCommand("y").execCommand("y");
    }
  });
  await new Promise(res => {
    session.server.once("started", (date: Date) => {
      console.log("pocketmine started at", date);
      console.log("Stoping pocketmine");
      res("")
    });
  });
  return session.commands.stop();
}
