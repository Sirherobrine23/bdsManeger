import platformManeger from "./platform";
import * as bdsTypes from "./globalType";

// Server Sessions
const Sessions: {[Session: string]: bdsTypes.BdsSession} = {};
export function getSessions(): {[SessionID: string]: bdsTypes.BdsSession} {return {
  ...Sessions,
  ...(platformManeger.bedrock.server.getSessions()),
  ...(platformManeger.java.server.getSessions()),
};}

// Start Server
export default Start;
export async function Start(Platform: bdsTypes.Platform, options?: bdsTypes.startServerOptions): Promise<bdsTypes.BdsSession> {
  if (Platform === "bedrock") return platformManeger.bedrock.server.startServer();
  else if (Platform === "java") return platformManeger.java.server.startServer();
  else if (Platform === "pocketmine") return platformManeger.pocketmine.server.startServer();
  else if (Platform === "spigot") return platformManeger.spigot.server.startServer();
  throw new Error(`Platform ${Platform} is not supported`);
}