export * from "./serverManeger.js";

import * as serverManeger from "./serverManeger.js";
import * as Bedrock from "./servers/bedrock.js";
import * as Java from "./servers/java.js";

export default {...serverManeger, serverManeger, Bedrock, Java };
export { serverManeger, Bedrock, Java };