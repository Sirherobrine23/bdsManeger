/**
 * Fetch data and return buffer
 * @param {String} url - The url of the file
 * @param {RequestInit} args - The request options
 * @returns {Buffer} The file buffer data
 */
async function BufferHTTP(url = "", args = {}) {
  const Fetch = (await import("node-fetch")).default;
  const res = await Fetch(url, {
    mode: "cors",
    ...args
  });
  if (res.ok) return Buffer.from(await res.arrayBuffer());
  else throw {
    Error: await res.text(),
    status: res.status,
    urlRequest: url,
  }
}
module.exports.BUFFER = BufferHTTP;
module.exports.buffer = BufferHTTP;
// Buffer

/**
 * Fetch data and return JSON parsed
 * @param {String} url - The url of the file
 * @param {RequestInit} args - The request options
 * @returns {any} The file JSON data
 */
async function JsonHTTP(url = "", args = {}) {
  const res = await BufferHTTP(url, args);
  return JSON.parse(res.toString());
}
module.exports.JSON = JsonHTTP;
module.exports.json = JsonHTTP;
// JSON

/**
 * Fetch data and return JSON parsed
 * @param {String} url - The url of the file
 * @param {RequestInit} args - The request options
 * @returns {String}
 */
async function TextHTTP(url = "", args = {}) {
  return (await BufferHTTP(url, args)).toString("utf8");
}
module.exports.TEXT = TextHTTP;
module.exports.text = TextHTTP;
// Raw Text

/**
 * Get github repository file paths
 * @param {String} repo - The repository name, example: "poggit/poggit"
 * @param {String} branch - The branch name, example: "main"
 * @returns {Promise<Array<{
 *  truncated: boolean;
 *  sha: string;
 *  url: string;
 *  tree: Array<{
 *    path: string;
 *    mode: string;
 *    type: string;
 *    sha: string;
 *    size: number;
 *    url?: string|undefined;
 *  }>;
 * }>} The repository files and Folder paths
 */
async function GithubTree(repo = "The-Bds-Maneger/Plugins_Repository", branch = "main") {
  return await JsonHTTP(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=true`);
}
module.exports.GithubTree = GithubTree;

/**
 * Get Github latest relases
 * 
 * @param {String} repo - The repository name, example: "poggit/poggit"
 * 
 * @return {Promise<{
 *  url: string;
 *  assets_url: string;
 *  upload_url: string;
 *  html_url: string;
 *  id: number;
 *  tarball_url: string;
 *  zipball_url: string;
 *  body: string;
 *  author: {
 *    login: string;
 *    id: number;
 *    node_id: string;
 *    avatar_url: string;
 *    gravatar_id: string;
 *    url: string;
 *    html_url: string;
 *    followers_url: string;
 *    following_url: string;
 *    gists_url: string;
 *    starred_url: string;
 *    subscriptions_url: string;
 *    organizations_url: string;
 *    repos_url: string;
 *    events_url: string;
 *    received_events_url: string;
 *    type: string;
 *    site_admin: boolean;
 *  };
 *  node_id: string;
 *  tag_name: string;
 *  target_commitish: string;
 *  name: string;
 *  draft: boolean;
 *  prerelease: boolean;
 *  created_at: string;
 *  published_at: string;
 * assets: Array<{
 *  url: string;
 *  id: number;
 *  node_id: string;
 *  name: string;
 *  label: string;
 *  content_type: string;
 *  state: string;
 *  size: number;
 *  download_count: number;
 *  created_at: string;
 *  updated_at: string;
 *  browser_download_url: string;
 *  uploader: {
 *    login: string;
 *    id: number;
 *    node_id: string;
 *    avatar_url: string;
 *    gravatar_id: string;
 *    url: string;
 *    html_url: string;
 *    followers_url: string;
 *    following_url: string;
 *    gists_url: string;
 *    starred_url: string;
 *    subscriptions_url: string;
 *    organizations_url: string;
 *    repos_url: string;
 *    events_url: string;
 *    received_events_url: string;
 *    type: string;
 *    site_admin: boolean;
 *  };
 * }>;
 */
async function GetLatestReleaseFromGithub(repo = "The-Bds-Maneger/Plugins_Repository") {
  return await JsonHTTP(`https://api.github.com/repos/${repo}/releases/latest`);
}
module.exports.GetLatestReleaseFromGithub = GetLatestReleaseFromGithub;
