if (typeof global.fetch !== "function") {
  global.fetch = (...args) => import("node-fetch").then(m => m.default(...args));
  import("node-fetch").then(m => global.fetch = m.default);
}

async function BufferHTTP(url = "", args = {}) {
  const res = await fetch(url, {
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
    buffer: BufferHTTP
}
