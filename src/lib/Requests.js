if (typeof global !== "undefined") {
  if (typeof global.fetch === "undefined") {
    global.fetch = (...args) => import("node-fetch").then(Fetch => Fetch.default(...args));
    import("node-fetch").then(Fetch => global.fetch = Fetch.default);
  }
}
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

async function JsonHTTP(url = "", args = {}) {
  const res = await BufferHTTP(url, args);
  return JSON.parse(res.toString());
}

async function TextHTTP(url = "", args = {}) {
  return (await BufferHTTP(url, args)).toString();
}

async function GithubTree(repo = "The-Bds-Maneger/Plugins_Repository", branch = "main") {
  let res = {
    "sha": "db0e9588de141e033b62bb581ac65b89f5c57f5b",
    "url": "https://api.github.com/repos/The-Bds-Maneger/Plugins_Repository/git/trees/db0e9588de141e033b62bb581ac65b89f5c57f5b",
    "tree": [
      {
        "path": ".gitignore",
        "mode": "100644",
        "type": "blob",
        "sha": "40b878db5b1c97fc77049537a71bb2e249abe5dc",
        "size": 13,
        "url": "https://api.github.com/repos/The-Bds-Maneger/Plugins_Repository/git/blobs/40b878db5b1c97fc77049537a71bb2e249abe5dc"
      },
      {
        "path": "repository",
        "mode": "040000",
        "type": "tree",
        "sha": "1dd3854f47e8c38200788f718058fac981a27227",
        "url": "https://api.github.com/repos/The-Bds-Maneger/Plugins_Repository/git/trees/1dd3854f47e8c38200788f718058fac981a27227"
      },
    ],
    "truncated": false
  }
  res = await JsonHTTP(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=true`);
  return res;
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
