import mongoose from "mongoose";
import connection from "./connect";

// Type to represent the spigot model
export type spigotSchema = {
  version: string,
  date: Date,
  latest: boolean,
  url: string
};

export const spigot = connection.model<spigotSchema>("spigot", new mongoose.Schema<spigotSchema>({
  version: {
    type: String,
    required: true,
    unique: true
  },
  date: Date,
  latest: Boolean,
  url: String
}));
