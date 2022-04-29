export function parsePorts(data: string): {port: number; version?: "IPv4"|"IPv6"}|void {
  const portParse = data.match(/(IPv[46])\s+supported,\s+port:\s+(.*)/);
  if (!!portParse) {
    return {
      port: parseInt(portParse[2]),
      version: portParse[1] as "IPv4"|"IPv6"
    };
  }
  return;
}

export function parseUserAction(data: string): {player: string; action: "connect"|"disconnect"|"unknown"; date: Date; xuid?: string;}|void {
  if (/r\s+.*\:\s+.*\,\s+xuid\:\s+.*/gi.test(data)) {
    const actionDate = new Date();
    const [action, player, xuid] = (data.match(/r\s+(.*)\:\s+(.*)\,\s+xuid\:\s+(.*)/)||[]).slice(1, 4);
    const __PlayerAction: {player: string, xuid: string|undefined, action: "connect"|"disconnect"|"unknown"} = {
      player: player,
      xuid: xuid,
      action: "unknown"
    };
    if (action === "connected") __PlayerAction.action = "connect";
    else if (action === "disconnected") __PlayerAction.action = "disconnect";
    return {
      player: __PlayerAction.player,
      action: __PlayerAction.action,
      date: actionDate,
      xuid: __PlayerAction.xuid||undefined
    };
  }
  return;
}