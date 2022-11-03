import mongoose from "mongoose";
import connection from "./connect";

export type bedrockSchema = {
  version: string,
  date: Date,
  latest: boolean,
  url: {
    win32: string,
    linux: string
  }
};

export const bedrock = connection.model<bedrockSchema>("bedrock", new mongoose.Schema<bedrockSchema>({
  version: {
    type: String,
    required: true,
    unique: true
  },
  date: Date,
  latest: Boolean,
  url: {
    win32: String,
    linux: String
  }
}));

