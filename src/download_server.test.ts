import downloadServer from "./download_server";
export const name = "installServer";

export async function bedrock() {
  console.log("Installing bedrock server");
  const data = await downloadServer("bedrock", "latest");
  console.log(data);
  return data;
}

export async function pocketmine() {
  console.log("Installing pocketmine server");
  const data = await downloadServer("pocketmine", "latest");
  console.log(data);
  return data;
}

export async function java() {
  console.log("Installing java server");
  const data = await downloadServer("java", "latest");
  console.log(data);
  return data;
}