import { MongoClient } from "mongodb";
import { localConfig } from "./config.js";

export const connection = await (new MongoClient(localConfig.mongoConnection)).connect();
export const mongoDatabase = connection.db(localConfig.mongoDatabase);