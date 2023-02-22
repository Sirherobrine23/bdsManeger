import { oracleBucket } from "@sirherobrine23/cloud";

export const oracleStorage = await oracleBucket.oracleBucket({
  region: "sa-saopaulo-1",
  namespace: "grwodtg32n4d",
  name: "bdsFiles",
  auth: {
    type: "preAuthentication",
    // Public auth (No write enabled).
    PreAuthenticatedKey: "0IKM-5KFpAF8PuWoVe86QFsF4sipU2rXfojpaOMEdf4QgFQLcLlDWgMSPHWmjf5W"
  }
});