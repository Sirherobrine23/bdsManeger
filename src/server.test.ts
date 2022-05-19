import * as server from "./server";
export const name = "startServer";
export const depends = "installServer";

export async function bedrock() {
  console.log("\nStarting bedrock server...");
  const session = await server.Start("bedrock");
  session.log.on("all", console.log);
  return new Promise<number>((res, rej) => {
    session.server.once("started", (date: Date) => {
      console.log("bedrock started at", date);
      console.log("Stoping bedrock");
      session.commands.stop().then(code => (code === null||code !== 0 ? rej(code) : res(code)));
    });
  })
}

export async function java() {
  console.log("\n\nStarting java server...");
  const session = await server.Start("java");
  session.log.on("all", console.log);
  return new Promise<number>((res, rej) => {
    session.server.once("started", (date: Date) => {
      console.log("java started at", date);
      console.log("Stoping java");
      session.commands.stop().then(code => (code === null||code !== 0 ? rej(code) : res(code)));
    });
  });
}

export async function pocketmine() {
  console.log("\n\nStarting pocketmine server...");
  const session = await server.Start("pocketmine");
  session.log.on("all", console.log);
  session.log.on("all", data => {
    // [*] PocketMine-MP set-up wizard
    if (/set-up\s+wizard/.test(data)) {
      console.log("Auto setup wizard");
      session.commands.execCommand("eng").execCommand("y").execCommand("y");
    }
  });
  return new Promise<number>((res, rej) => {
    session.server.once("started", (date: Date) => {
      console.log("pocketmine started at", date);
      console.log("Stoping pocketmine");
      session.commands.stop().then(code => (code === null||code !== 0 ? rej(code) : res(code)));
    });
  });
}