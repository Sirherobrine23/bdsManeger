(async ()=>{
    try {
        const bds = require("../../index");
        await bds.download("latest", true);
        console.log("Api:", bds.api());
        console.log("Backup:", bds.backup());
        console.log("Detect Server:", bds.detect());
        console.log("Kill Server:", bds.kill());
        console.log("Get Config:", bds.get_config());
        console.log("Start:", bds.start());
        setTimeout(() => {
            console.log("Kill Server:", bds.kill());
            setTimeout(() => process.exit(0), 1000);
        }, 1 * 30 * 1000);
    } catch (err) {
        console.log("Detect Error:", err);
        process.exit(1)
    }
})()
