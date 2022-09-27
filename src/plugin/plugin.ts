import path from "node:path/posix";
import fs from "node:fs/promises";
import admZip from "adm-zip";
import * as globalPlatfroms from "../globalPlatfroms";
import { saveFile, githubTree, getJSON } from "../httpRequest";

// Ingore
export {path, fs, admZip, globalPlatfroms, saveFile, githubTree, getJSON};

export class pluginManeger {};