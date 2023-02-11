import { Cloud } from "@sirherobrine23/coreutils";

export const oracleBucket = await Cloud.oracleBucket({
  region: "sa-saopaulo-1",
  namespace: "grwodtg32n4d",
  name: "bdsFiles",
  auth: {
    type: "preAuthentication",
    PreAuthenticatedKey: "0IKM-5KFpAF8PuWoVe86QFsF4sipU2rXfojpaOMEdf4QgFQLcLlDWgMSPHWmjf5W"
  }
});