import platformManeger from "./platform";
import { BdsSession, Platform } from "./globalType";

// Server Sessions
const Sessions: {[Session: string]: BdsSession} = {};
export function getSessions(): {[SessionID: string]: BdsSession} {return {
  ...Sessions,
  ...(platformManeger.bedrock.server.getSessions()),
  ...(platformManeger.pocketmine.server.getSessions()),
  ...(platformManeger.java.server.getSessions()),
  ...(platformManeger.spigot.server.getSessions()),
};}

// Start Server
export default StartServer;
export async function StartServer(Platform: Platform): Promise<BdsSession> {
  if (Platform === "bedrock") return platformManeger.bedrock.server.startServer();
  else if (Platform === "java") return platformManeger.java.server.startServer();
  else if (Platform === "pocketmine") return platformManeger.pocketmine.server.startServer();
  else if (Platform === "spigot") return platformManeger.spigot.server.startServer();
  throw new Error(`Platform ${Platform} is not supported`);
}