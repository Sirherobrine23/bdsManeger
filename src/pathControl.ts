import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// bds Root
export const bdsRoot = process.env.BDS_HOME||path.join(os.homedir(), ".bdsManeger");
if (!fsOld.existsSync(bdsRoot)) fs.mkdir(bdsRoot, {recursive: true}).then(() => console.log("Bds Root created"));

// Server Folder
export const serverRoot = path.join(bdsRoot, "Servers");
if (!fsOld.existsSync(serverRoot)) fs.mkdir(serverRoot, {recursive: true});

// Logs Folder
export const logRoot = path.join(bdsRoot, "logFolder");
if (!fsOld.existsSync(logRoot)) fs.mkdir(logRoot, {recursive: true});

// Worlds Folder
export const worldFolder = path.join(bdsRoot, "Worlds");
if (!fsOld.existsSync(worldFolder)) fs.mkdir(serverRoot, {recursive: true});

// Bds backup
export const backupFolder = path.join(bdsRoot, "Backup");
if (!fsOld.existsSync(backupFolder)) fs.mkdir(backupFolder, {recursive: true});