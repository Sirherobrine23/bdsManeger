import mongoose from "mongoose";
import connection from "./connect";

export type javaSchema = {
  version: string,
  date: Date,
  latest: boolean,
  url: string
};

export const java = connection.model<javaSchema>("java", new mongoose.Schema<javaSchema>({
  version: {
    type: String,
    required: true,
    unique: true
  },
  date: Date,
  latest: Boolean,
  url: String
}));
export default java;

