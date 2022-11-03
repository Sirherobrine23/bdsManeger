import mongoose from "mongoose";
import connection from "./connect";

export type paperSchema = {
  version: string,
  build: number,
  date: Date,
  latest: boolean,
  url: string
};

export const paper = connection.model<paperSchema>("paper", new mongoose.Schema<paperSchema>({
  version: String,
  build: Number,
  date: Date,
  latest: Boolean,
  url: String
}));

