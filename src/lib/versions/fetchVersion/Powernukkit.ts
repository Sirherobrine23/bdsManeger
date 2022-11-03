import { powernukkit, powernukkitSchema } from "../db/powernukkit";
import { getJSON as getJson } from "@http/simples";
export const exportUrl = "https://raw.githubusercontent.com/PowerNukkit/powernukkit-version-aggregator/master/powernukkit-versions.json";
export type Release = {
  version: string,
  releaseTime: number,
  minecraftVersion: string,
  artefacts: string[],
  commitId:  string,
  snapshotBuild?: number
}
export type PowernukkitVersions = {
  releases: Release[],
  snapshots: Release[]
}

function buildVersion(data: Release): powernukkitSchema|void {
  let artefacts: {[key: string]: any} = {};
  data.artefacts.forEach(function(artefactId) {
    artefacts[artefactId] = buildArtefactUrl(data, artefactId);
  });
  if (data.commitId) {
    artefacts["GIT_SOURCE"] = buildArtefactUrl(data, "GIT_SOURCE");
  }
  if (!data.snapshotBuild) {
    artefacts["ONLINE_DOC"] = buildArtefactUrl(data, "ONLINE_DOC");
  }

  const releaseTime = new Date(data.releaseTime);
  let url = getBestDownloadUrl(artefacts);
  if (!url) return;
  const schema: powernukkitSchema = {
    version: data.version,
    mcpeVersion: data.minecraftVersion,
    date: releaseTime,
    latest: false,
    variantType: data.snapshotBuild === undefined ? "stable":"snapshot",
    url
  };

  return schema;
}

function getBestDownloadUrl(artefacts): string {
  if (artefacts.SHADED_JAR) {
    return artefacts.SHADED_JAR;
  } else {
    return artefacts.REDUCED_JAR;
  }
}

function buildArtefactUrl(data: any, artefactId?: string): string|void {
  if (artefactId == "GIT_SOURCE") {
    return buildGitSourceUrl(data);
  } else if (artefactId == "ONLINE_DOC") {
    return buildOnlineDocUrl(data);
  } else if (data.snapshotBuild) {
    return buildSnapshotArtefactUrl(data, artefactId);
  } else {
    return buildReleaseArtefactUrl(data, artefactId);
  }
}

function buildOnlineDocUrl(data: any) {
  if (data.snapshotBuild) {
    if (data.artefacts.includes("JAVADOC_JAR")) {
      return buildSnapshotArtefactUrl(data, "JAVADOC_JAR");
    }
  }
  return "https://devs.powernukkit.org/#javadoc";
}

function buildGitSourceUrl(data) {
  if (data.commitId) {
    return "https://github.com/PowerNukkit/PowerNukkit/tree/" + data.commitId;
  } else if (data.snapshotBuild) {
    if (data.artefacts.includes("SHADED_SOURCES_JAR")) {
      return buildSnapshotArtefactUrl(data, "SHADED_SOURCES_JAR");
    } else if (data.artefacts.includes("REDUCED_SOURCES_JAR")) {
      return buildSnapshotArtefactUrl(data, "REDUCED_SOURCES_JAR");
    }
  } else {
    if (data.artefacts.includes("SHADED_SOURCES_JAR")) {
      return buildReleaseArtefactUrl(data, "SHADED_SOURCES_JAR");
    } else if (data.artefacts.includes("REDUCED_SOURCES_JAR")) {
      return buildReleaseArtefactUrl(data, "REDUCED_SOURCES_JAR");
    }
  }
}

function buildReleaseArtefactUrl(data: any, artefactId?: string): string|void {
  if (!data.artefacts.includes(artefactId)) {
    return;
  }
  return "https://search.maven.org/remotecontent?filepath=org/powernukkit/powernukkit/" +
    data.version +
    "/powernukkit-" +
    data.version +
    getArtefactExtension(artefactId);
}

function buildSnapshotArtefactUrl(data: any, artefactId?: string): string|void {
  if (!data.artefacts.includes(artefactId)) {
    return;
  }
  let dt = new Date(data.releaseTime);
  let snapshotCode = dt.getUTCFullYear().toString().padStart(4, "0") +
      (dt.getUTCMonth() + 1).toString().padStart(2, "0") +
      dt.getUTCDate().toString().padStart(2, "0") +
      "." +
      dt.getUTCHours().toString().padStart(2, "0") +
      dt.getUTCMinutes().toString().padStart(2, "0") +
      dt.getUTCSeconds().toString().padStart(2, "0") +
      "-" +
      data.snapshotBuild;
  let snapshotIndex = data.version.indexOf("-SNAPSHOT");
  let version =  data.version.substring(0, snapshotIndex);
  let extension = getArtefactExtension(artefactId);
  return "https://oss.sonatype.org/content/repositories/snapshots/org/powernukkit/powernukkit" +
    "/" +
    version + "-SNAPSHOT" +
    "/" +
    "powernukkit-" + version +
    "-" +
    snapshotCode +
    extension
}

function getArtefactExtension(artefactId) {
  let extension = ".unknown";
  switch (artefactId) {
    case "REDUCED_JAR": extension = ".jar"; break;
    case "REDUCED_SOURCES_JAR": extension = "-sources.jar"; break;
    case "SHADED_JAR": extension = "-shaded.jar"; break;
    case "SHADED_SOURCES_JAR": extension = "-shaded-sources.jar"; break;
    case "JAVADOC_JAR": extension = "-javadoc.jar"; break;
  }
  return extension;
}

export default async function find() {
  const releases_version = await getJson(exportUrl) as PowernukkitVersions;
  for (const stable of releases_version.releases) {
    const data = buildVersion(stable);
    if (!data) continue
    if (await powernukkit.findOne({version: data.version}).lean()) continue;
    await powernukkit.create(data);
    console.log("Powernukkit stable add %s version to minecraft bedrock %s version", data.version, data.mcpeVersion);
  }
  for (const snapshot of releases_version.snapshots) {
    const data = buildVersion(snapshot);
    if (!data) continue
    if (await powernukkit.findOne({version: data.version}).lean()) continue;
    await powernukkit.create(data);
    console.log("Powernukkit snapshort add %s version to minecraft bedrock %s version", data.version, data.mcpeVersion);
  }
  const oldLatest = await powernukkit.findOneAndUpdate({latest: true}, {$set: {latest: false}}).lean();
  const latestVersion = (await powernukkit.find({variantType: "stable"}).lean()).sort((b, a) => a.date.getTime()-b.date.getTime())[0];
  await powernukkit.findOneAndUpdate({version: latestVersion.version, variant: {variantType: "stable"}}, {$set: {latest: true}}).lean().catch(err => powernukkit.findOneAndUpdate({version: oldLatest.version}, {$set: {latest: true}}).lean().then(() => Promise.reject(err)));
  return;
}
