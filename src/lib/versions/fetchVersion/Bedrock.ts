import adm_zip from "adm-zip";
import { bufferFetch, urls } from "@http/simples";
import { bedrock, bedrockSchema } from "../db/bedrock";

export default async function UpdateDatabase() {
  const minecraftUrls = (await urls("https://minecraft.net/en-us/download/server/bedrock")).filter(Link => /bin-.*\.zip/.test(Link));
  const objURLs: {linux: string, win32: string} = {linux: undefined, win32: undefined};
  minecraftUrls.forEach((url: string) => {
    if (/darwin|macos|mac/.test(url)) console.log("Macos Are now supported: %s", url);
    else if (/win/.test(url)) objURLs.win32 = url;
    else if (/linux/.test(url)) objURLs.linux = url;
  });
  const anyZip = objURLs.win32||objURLs.linux;
  if (!anyZip) throw new Error("cannot get url");
  const [, mcpeVersion] = anyZip.match(/\/[a-zA-Z-_]+([0-9\.]+).zip$/)||[];
  const mcpeDate = await new Promise<Date>(async resolve => {
    const zip = new adm_zip((await bufferFetch(objURLs.linux)).data);
    for (const entry of zip.getEntries()) {
      if (entry.entryName === "bedrock_server") return resolve(entry.header.time);
    };
    return resolve(new Date());
  });
  if (!mcpeVersion) return;
  const version: bedrockSchema = {
    version: mcpeVersion,
    date: mcpeDate,
    latest: false,
    url: {
      linux: objURLs.linux,
      win32: objURLs.win32
    }
  };
  if (await bedrock.findOne({version: version.version}).lean()) {
    console.log("Bedrock version %s are exists", version.version);
    return;
  }
  await bedrock.create(version);
  console.log("Bedrock adding new version %s", version.version);
  await bedrock.findOneAndUpdate({latest: true}, {$set: {latest: false}});
  const latest = (await bedrock.find().lean()).sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  await bedrock.findByIdAndUpdate(latest._id, {$set: {latest: true}});
}
