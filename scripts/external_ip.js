(async () => {
    if (typeof fetch === "undefined"){
        global.fetch = require("node-fetch")
    }
    try {
        // Plain
        const plain_text = await fetch("https://ipecho.net/plain")
        const plain_text_result = await plain_text.text()
        const plain = await plain_text_result

        // apify
        const ipify_request = await fetch("https://api.ipify.org/?format=json")
        const ipify_test = await ipify_request.json()
        const ipify = await ipify_test.ip
        
        var ip;
        if (plain !== ipify){
            console.log("ipify")
            ip = await ipify
        } else {
            console.log("plain")
            ip = await plain
        }
        module.exports.ip = ip
    } catch (error) {
        console.error(error)
    }
})()