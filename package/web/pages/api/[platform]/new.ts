import type { NextApiRequest, NextApiResponse } from "next";
import bdsCore from "@the-bds-maneger/core";
import auth from "../../../libs/auth";

export default async function newServer(req: NextApiRequest, res: NextApiResponse) {
  if (await auth(req, res)) return res.status(400).json({error: "Required valid authorization"});
  const platform = req.query.platform as "bedrock"|"java";
  if (platform === "bedrock") {
    const { id, version } = await bdsCore.Bedrock.installServer({
      newID: true,
      allowBeta: req.query.allowBeta === "true",
      altServer: (req.query.altserver || req.query.altServer) as any,
      version: req.query.version as any
    });
    return res.json({
      version,
      id,
    });
  } else if (platform === "java") {
    const { id, version } = await bdsCore.Java.installServer({
      newID: true,
      altServer: (req.query.altserver || req.query.altServer) as any,
      version: req.query.version as any
    });
    return res.json({
      version,
      id,
    });
  } else return res.status(400).json({
    error: "invalid platform"
  });
}