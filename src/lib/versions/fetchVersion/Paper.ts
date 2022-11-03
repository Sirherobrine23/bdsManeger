import { getJSON as getJson } from "@http/simples";
import { paper } from "../db/paper";

type paperVersions = {
  project_id: string,
  project_name: string,
  version_groups: string[],
  versions: string[]
};

type paperBuilds = {
  project_id: string,
  project_name: string,
  version: string,
  builds: {
    build: number;
    time: string;
    channel: string;
    promoted: boolean;
    changes: {commit:  string, summary: string, message: string}[];
    downloads: {
      application: {name: string, sha256: string},
      mojangMappings: {name: string, sha256: string}
    }
  }[]
};

export default async function find() {
  const versions = (await getJson<paperVersions>("https://api.papermc.io/v2/projects/paper")).versions;
  for (const version of versions) {
    const builds = await getJson<paperBuilds>(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds`);
    await Promise.all(builds.builds.map(async function(build){
      const downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${builds.version}/builds/${build.build}/downloads/${build.downloads.application.name}`;
      if (await paper.findOne({url: downloadUrl}).lean()) return;
      await paper.create({
        version: builds.version,
        build: build.build,
        date: new Date(build.time),
        url: downloadUrl,
        latest: false
      });
      return console.log("Paper add %s version, build %s", builds.version, build.build);
    }));
  }
  await paper.findOneAndUpdate({latest: true}, {$set: {latest: false}}).lean();
  const latestVersionByDate = (await paper.find().lean()).sort((a, b) => b.date.getTime()-a.date.getTime())[0];
  await paper.findByIdAndUpdate(latestVersionByDate._id, {$set: {latest: true}}).lean();
}
