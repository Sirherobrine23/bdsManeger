import { serverManeger, pathOptions } from "../serverManeger.js";

export default async function Bedrock(options?: pathOptions & {variant?: string}) {
  options = {...options};

  return serverManeger({
    exec: {
      exec: "java",
      args: []
    },
    actions: {}
  })
}