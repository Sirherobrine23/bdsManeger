import mongoose from "mongoose";
import connection from "./connect";
import { Router } from "express";
export const app = Router();

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

app.get("/", ({res}) => paper.find().lean().then(data => res.json(data)));
app.get("/latest", ({res}) => paper.findOne({latest: true}).lean().then(data => res.json(data)));
app.get("/search", async (req, res) => {
  let version = req.query.version as string;
  if (!version) return res.status(400).json({erro: "Not allowd blank version"});
  let build = parseInt(req.query.build as string);
  if (isNaN(build)) build = undefined;
  if (!!build) {
    const info = await paper.findOne({
      version,
      build
    });
    if (!info) return res.status(400).json({error: "version and build not exists"});
    return res.json(info);
  }
  const info = await paper.findOne({
    version
  });
  if (!info) return res.status(400).json({error: "version not exists"});
  return res.json(info);
});