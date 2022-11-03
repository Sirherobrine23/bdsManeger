import mongoose from "mongoose";
import connection from "./connect";

export type powernukkitSchema = {
  version: string,
  mcpeVersion: string,
  date: Date,
  latest: boolean,
  url: string,
  variantType: "stable"|"snapshot"
};

export const powernukkit = connection.model<powernukkitSchema>("powernukkit", new mongoose.Schema<powernukkitSchema>({
  version: {
    type: String,
    unique: false,
    required: true
  },
  mcpeVersion: String,
  date: Date,
  url: String,
  variantType: String,
  latest: Boolean
}));
