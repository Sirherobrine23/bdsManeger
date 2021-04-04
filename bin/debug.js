const {rest, bds_dir, bds_detect, bds_dir_bedrock, bds_dir_java} = require("../index")
console.log(`Bds Maneher Detect Run: ${bds_detect()}`);
console.log("Initialize the REST API");
rest()
console.log(`Bds Maneger CORE dir: ${bds_dir}. ${bds_dir_bedrock}, ${bds_dir_java}`);