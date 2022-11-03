import mongoose from "mongoose";
import connection from "./connect";
import { Router } from "express";
export const app = Router();

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

app.get("/", ({res}) => powernukkit.find().lean().then(data => res.json(data)));
app.get("/latest", ({res}) => powernukkit.findOne({latest: true}).lean().then(data => res.json(data)));
app.get("/search", async (req, res) => {
  let version = req.query.version as string;
  let variant = (req.query.variant as string)||undefined;
  if (!version) return res.status(400).json({error: "No version specified"});
  const versionDB = await powernukkit.findOne({version, variant: {to: variant}}).lean();
  if (!versionDB) return res.status(404).json({error: "Version not found"});
  return res.json(versionDB);
});