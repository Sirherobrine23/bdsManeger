module.exports = () => {
    require("express");
    if (typeof fetch === "undefined"){
        var fetch = require("node-fetch")
    }
    const themes = "https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/themes.json"
    fetch(themes).then(response => response.json()).then(array => {
        for (let index = 0; index < array.length; index++) {
            const name = array[index].name;
            const zip_url = array[index].zip_url;
            const git_url = array[index].git_url;
            console.log(`Name: ${name},\n Url Zip: ${zip_url},\n Git url: ${git_url}`)
        }
    }).catch(function(error) {
        console.log(`Could not get credentials, Error: \"${error.message}\"`);
    });
}