export function parsePorts(data: string): {port: number; version?: "IPv4"|"IPv6"}|void {
  if (/\[.*\]:\s+Minecraft\s+network\s+interface\s+running\s+on\s+(.*)/gi.test(data)) {
    const portParse = data.match(/\[.*\]:\s+Minecraft\s+network\s+interface\s+running\s+on\s+(.*)/)[1];
    if (!!portParse) {
      if (/\[.*\]/.test(portParse)) {
        return {
          port: parseInt(portParse.split(":")[1]),
          version: "IPv6"
        };
      } else {
        return {
          port: parseInt(portParse.split(":")[1]),
          version: "IPv4"
        };
      }
    }
  }
  return;
}

export function parseUserAction(data: string): {player: string; action: "connect"|"disconnect"|"unknown"; date: Date; xuid?: string;}|void {
  if (/\[.*\]:\s+(.*)\s+(.*)\s+the\s+game/gi.test(data)) {
    const actionDate = new Date();
    const [action, player] = (data.match(/[.*]:\s+(.*)\s+(.*)\s+the\s+game/gi)||[]).slice(1, 3);
    const __PlayerAction: {player: string, action: "connect"|"disconnect"|"unknown"} = {
      player: player,
      action: "unknown"
    };
    if (action === "joined") __PlayerAction.action = "connect";
    else if (action === "left") __PlayerAction.action = "disconnect";
    return {
      player: __PlayerAction.player,
      action: __PlayerAction.action,
      date: actionDate
    };
  }
  return;
}