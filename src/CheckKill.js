const child_process = require("child_process");
const systeminformation = require("systeminformation");

async function getProcess(){
  const Process = await (await systeminformation.processes()).list;
  return Process.map(Process => {
    const { pid, command, mem, params } = Process;
    return {
      command: `${command} ${params}`,
      mem,
      pid,
      Kill: async () => {
        if (process.platform === "win32") return child_process.execSync(`taskkill /PID ${pid} /F`).toString("utf8");
        else return child_process.execSync(`kill -9 ${pid}`).toString("utf8")
      }
    }
  });
}

async function Detect(){
  const CurrentProcess = await getProcess();
  let Status = false;
  for (let check of CurrentProcess) {
    if (/MinecraftServerJava\.jar/.test(check.command)) Status = true;
    if (/spigot\.jar/.test(check.command)) Status = true;
    if (/bedrock_server/.test(check.command)) Status = true;
    if (/PocketMine-MP\.phar/.test(check.command)) Status = true;
    if (/Dragonfly/.test(check.command)) Status = true;
  }
  return Status;
}

async function Kill(){
  const CurrentProcess = await getProcess();
  if (!(await Detect())) return false
  for (let check of CurrentProcess) {
    if (/MinecraftServerJava.jar/.test(check.command)) {
      console.log("Killing Minecraft Server Java");
      await check.Kill();
    }
    if (/spigot.jar/.test(check.command)) {
      console.log("Killing Spigot");
      await check.Kill();
    }
    if (/bedrock_server/.test(check.command)) {
      console.log("Killing Minecraft Bedrock Server");
      await check.Kill();
    }
    if (/PocketMine-MP.phar/.test(check.command)) {
      console.log("Killing Pocketmine-MP");
      await check.Kill();
    }
    if (/Dragonfly/.test(check.command)) {
      console.log("Killing Dragonfly");
      await check.Kill();
    }
  }
  return true
}

module.exports = {
  getProcess,
  Detect,
  Kill
}