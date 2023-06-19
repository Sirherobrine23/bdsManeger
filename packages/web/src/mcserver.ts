import express from "express";
import { random } from "./auth.js";
import { mongoDatabase } from "./databaseConnect.js";

type serverStor = {
  readonly ID: string;
};

export const serverCollection = mongoDatabase.collection<serverStor>("servers");
export async function generateID() {
  let ID: string;
  while (true) if (!(await serverCollection.findOne({ID: (ID = random())}))) break;
  return ID;
}

const app = express.Router();
export default app;