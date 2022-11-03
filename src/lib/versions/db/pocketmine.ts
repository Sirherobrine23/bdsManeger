import mongoose from "mongoose";
import connection from "./connect";

export type pocketminemmpSchema = {
  version: string,
  date: Date,
  latest: boolean,
  url: string
};

export const pocketmine = connection.model<pocketminemmpSchema>("pocketminemmp", new mongoose.Schema<pocketminemmpSchema>({
  version: {
    type: String,
    required: true,
    unique: true
  },
  date: Date,
  latest: Boolean,
  url: String
}));

