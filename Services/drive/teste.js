//index.js
const gdrive = require("./drive");
gdrive.imageUpload("teste.zip", "./teste.zip", (id) => {
    console.log(id);
});