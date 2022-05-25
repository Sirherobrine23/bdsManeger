import { CronJob } from "cron";
import { gitBackupOption } from "./backup/git";

export type Platform = "bedrock"|"java"|"pocketmine"|"spigot";
export const PlatformArray = ["bedrock", "java", "pocketmine", "spigot"];

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

export type BdsSession = {
  /** Server Session ID */
  id: string;
  /** Server Started date */
  startDate: Date;
  /** if exists server map get world seed, fist map not get seed */
  seed?: string|number;
  /** Server Started */
  started: boolean;
  /** Some platforms may have a plugin manager. */
  addonManeger?: any;
  /** register cron job to create backups */
  creteBackup: (crontime: string|Date, option?: {type: "git"; config: gitBackupOption}|{type: "zip"}) => CronJob;
  /** callback to log event */
  log: {
    on: (eventName: "all"|"err"|"out", listener: (data: string) => void) => void;
    once: (eventName: "all"|"err"|"out", listener: (data: string) => void) => void;
  };
  /** If the server crashes or crashes, the callbacks will be called. */
  onExit: (callback: (code: number) => void) => void;
  /** Server actions, example on avaible to connect or banned¹ */
  server: {
    /** Server actions, example on avaible to connect or banned¹ */
    on: (act: "started"|"ban", call: (...any) => void) => void;
    /** Server actions, example on avaible to connect or banned¹ */
    once: (act: "started"|"ban", call: (...any) => void) => void;
  };
  /** Get server players historic connections */
  getPlayer: () => {[player: string]: {action: "connect"|"disconnect"|"unknown"; date: Date; history: Array<{action: "connect"|"disconnect"|"unknown"; date: Date}>}};
  /** This is a callback that call a function, for some player functions */
  onPlayer: (callback: (data: {player: string; action?: "connect"|"disconnect"|"unknown"; date: Date;}) => string) => void;
  /** Get Server ports. listening. */
  ports: () => Array<{port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}>;
  /** Basic server functions. */
  commands: bdsSessionCommands;
};