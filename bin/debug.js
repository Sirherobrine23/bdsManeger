const { bds_dir, bds_detect, bds_dir_bedrock, bds_dir_java, bds_dir_pocketmine } = require("../index")
console.log(`Bds Maneger Detect Run: ${bds_detect()}`);
console.log(`Bds Maneger Core dir: ${JSON.stringify({
    "Core": bds_dir,
    "Bedrock": bds_dir_bedrock,
    "Java": bds_dir_java,
    "Pocketmine": bds_dir_pocketmine
}, null, 4)}`);