import * as httpRequest from "../../lib/HttpRequests";

export async function getPlugins(): Promise<Array<{
  id: number,
  name: string,
  version: string,
  html_url: string,
  tagline: string,
  artifact_url: string,
  downloads: number,
  score: number,
  repo_id: number,
  repo_name: string,
  project_id: number,
  project_name: string,
  build_id: number,
  build_number: number,
  build_commit: string,
  description_url: string,
  icon_url: string,
  changelog_url: string,
  license: string,
  license_url: null,
  is_obsolete: false,
  is_pre_release: false,
  is_outdated: false,
  is_official: false,
  submission_date: number,
  state: number,
  last_state_change_date: number,
  categories: Array<{ major: true|false, category_name: string }>,
  keywords: Array<string>,
  api: Array<{from: string}>,
  deps: Array<any>,
  producers: {Collaborator: Array<string>},
  state_name: string
}>> {
  return await httpRequest.getBuffer("https://poggit.pmmp.io/plugins.json").then(async res => JSON.parse(await res.toString("utf8")))
}