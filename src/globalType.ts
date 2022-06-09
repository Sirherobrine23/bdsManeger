import { CronJob } from "cron";
import { gitBackupOption } from "./backup/git";

export type Platform = "bedrock"|"java"|"pocketmine"|"spigot";
export const PlatformArray = ["bedrock", "java", "pocketmine", "spigot"];

// Bds Session on declaretion function types
export type bdsSessionCommands = {
  /** Exec any commands in server */
  execCommand: (...command: Array<string|number>) => bdsSessionCommands;
  /** Teleport player to Destination */
  tpPlayer: (player: string, x: number, y: number, z: number) => bdsSessionCommands;
  /** Change world gamemode */
  worldGamemode: (gamemode: "survival"|"creative"|"hardcore") => bdsSessionCommands;
  /** Change gamemode to specified player */
  userGamemode: (player: string, gamemode: "survival"|"creative"|"hardcore") => bdsSessionCommands;
  /** Stop Server */
  stop: () => Promise<number|null>;
};
export type startServerOptions = {
  /** Save only worlds/maps without server software - (Beta) */
  storageOnlyWorlds?: boolean;
  gitBackup?: gitBackupOption;
};
export type playerAction1 = {player: string, Date: Date; xuid?: string|undefined}
export type playerAction2 = playerAction1 & {action: "connect"|"disconnect"|"unknown"}

// Server events
export interface serverOn {
  (act: "started", fn: (data: Date) => void);
  (act: "err", fn: (data: Error|number) => void);
  (act: "closed", fn: (data: number) => void);
  (act: "player_ban", fn: (data: playerAction1) => void);
  (act: "player", fn: (data: playerAction2) => void);
  (act: "player_connect", fn: (data: playerAction1) => void);
  (act: "player_disconnect", fn: (data: playerAction1) => void);
  (act: "player_unknown", fn: (data: playerAction1) => void);
  (act: "port_listen", fn: (data: {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}) => void);
  (act: "log", fn: (data: string) => void);
  (act: "log_stdout", fn: (data: string) => void);
  (act: "log_stderr", fn: (data: string) => void);
}
export type serverListen = {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"};
export type playerObject = {[player: string]: {action: "connect"|"disconnect"|"unknown"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"; date: Date}>}};

export type BdsSession = {
  /** Server Session ID */
  id: string;
  logFile?: string;
  /** register cron job to create backups */
  creteBackup: (crontime: string|Date, option?: {type: "git"; config: gitBackupOption}|{type: "zip", pathStorage?: string}) => CronJob;
  /** Get server players historic connections */
  Player: playerObject;
  /** Get Server ports. listening. */
  ports: Array<serverListen>;
  /** if exists server map get world seed, fist map not get seed */
  seed?: string|number;
  /** Server actions, example on avaible to connect or banned¹ */
  server: {
    /** Server actions, example on avaible to connect or banned¹ */
    on: serverOn;
    /** Server actions, example on avaible to connect or banned¹ */
    once: serverOn;
    /** Server Started date */
    startDate: Date;
    /** Server Started */
    started: boolean;
  };
  /** Basic server functions. */
  commands: bdsSessionCommands;
};