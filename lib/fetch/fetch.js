const fetch = require("node-fetch");
const options = (function(){
    if (process.env.REQUEST_OPTIONS) return JSON.parse(process.env.REQUEST_OPTIONS)
    return {}
})()
const prefetch = fetch(process.env.URL_REQUEST, options)

// parse
if (process.env.TYPE_REQUEST === "true") prefetch.then(res=>res.arrayBuffer()).then(res => Buffer.from(res)).then(res => console.log(res))
else prefetch.then(res=>res.text()).then(res => console.log(res))