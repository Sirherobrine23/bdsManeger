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
    status: res.status
  }
}

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

/**
 * Fetch data and return JSON parsed
 * @param {String} url - The url of the file
 * @param {RequestInit} args - The request options
 * @returns {String}
 */
async function TextHTTP(url = "", args = {}) {
  return (await BufferHTTP(url, args)).toString("utf8");
}

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

// Export Bds Request
module.exports = {
    // JSON
    JSON: JsonHTTP,
    json: JsonHTTP,

    // Raw Text
    TEXT: TextHTTP,
    text: TextHTTP,
    
    // Buffer
    BUFFER: BufferHTTP,
    buffer: BufferHTTP,

    // Others
    GithubTree
}
