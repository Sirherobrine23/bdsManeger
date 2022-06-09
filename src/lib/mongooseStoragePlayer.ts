import mongoose from "mongoose";
import { Platform } from '../globalType';

export type PlayerSchema = {
  Player: string,
  Ban: boolean,
  Platform: Platform,
  FistDate: Date,
  LastUpdateDate: Date,
  ConnectionHistoric: Array<{
    ConnectionType: "connect" | "disconnect" | "unknown",
    Date: Date
  }>
};

export const schema = new mongoose.Schema<PlayerSchema>({
  Player: {
    type: String,
    required: true
  },
  Ban: {
    type: Boolean,
    required: true
  },
  Platform: {
    type: String,
    enum: ["bedrock", "java", "pocketmine", "spigot"],
    required: true
  },
  FistDate: {
    type: Date,
    required: true
  },
  LastUpdateDate: {
    type: Date,
    required: true
  },
  ConnectionHistoric: [
    {
      ConnectionType: {
        type: String,
        enum: ["connect", "disconnect", "unknown"],
        required: true
      },
      Date: {
        type: Date,
        required: true
      }
    }
  ]
});
export default schema;