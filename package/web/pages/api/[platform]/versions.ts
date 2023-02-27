import type { NextApiRequest, NextApiResponse } from "next";
import bdsCore from "@the-bds-maneger/core";

export default async function newServer(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(404).json({error: "GET only"});
  const platform = req.query.platform as "bedrock"|"java";
  if (platform === "bedrock") res.json(await bdsCore.Bedrock.listVersions(req.query.altServer as any));
  else if (platform === "java") res.json(await bdsCore.Java.listVersions(req.query.altServer as any));
  else return res.status(400).json({
    error: "invalid platform"
  });
}