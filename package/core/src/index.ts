export * from "./serverManeger.js";
export * as Bedrock from "./servers/bedrock.js";
export * as Java from "./servers/java.js";

import * as serverManeger from "./serverManeger.js";
import * as Bedrock from "./servers/bedrock.js";
import * as Java from "./servers/java.js";
export default {
  ...serverManeger,
  Bedrock,
  Java
};
