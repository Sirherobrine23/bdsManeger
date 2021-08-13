(async ()=>{
    try {
        const bds = require("../../index");
        await bds.download("latest", true);
        console.log("Api:", await bds.api());
        console.log("Backup:", await bds.backup());
        console.log("Detect Server:", await bds.detect());
        console.log("Kill Server:", await bds.kill());
        console.log("Get Config:", await bds.get_config());
        console.log("Start:", await bds.start());
        setTimeout(() => {
            console.log("Kill Server:", bds.kill());
        }, 1 * 30 * 1000);
        setTimeout(() => {
            process.exit(0);
        }, 1 * 60 * 1000);
    } catch (err) {
        console.log("Detect Error:", err);
        process.exit(1)
    }
})()