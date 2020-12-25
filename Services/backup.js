function World_BAckup() {
    if (process.platform == "win32") {
        
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        var hour = today.getHours();
        var minu = today.getMinutes();
        today = `Date_${yyyy}-${mm}-${dd}(Hour_${hour}-Minutes_${minu})`;
        var name = `${process.env.USERPROFILE}/Desktop/bds_backup_World_${today}.zip`
        var dir_zip = `${require('../index').server_dir}/worlds/`
    } else if (process.platform == 'linux') {
        
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        var hour = today.getHours();
        var minu = today.getMinutes();
        today = `Date_${yyyy}-${mm}-${dd} Hour_${hour}-Minutes_${minu}`;
        var name = `${process.env.HOME}/bds_backup_World_${today}.zip`
        var dir_zip = `${require('../index').server_dir}/worlds/`
    }; /* End Files name */
    /* Compress the folders */
    var AdmZip = require('adm-zip');
    var zip = new AdmZip();
    zip.addLocalFolder(dir_zip); /* var willSendthis = zip.toBuffer(); */
    zip.addZipComment(`Backup zip file in ${today}. \nBackup made to ${process.platform}, Free and open content for all\n\nSirherobrine23© By Bds Maneger.`)
    var zipEntries = zip.getEntries();
    zipEntries.forEach(function (zipEntry) {
        console.log(zipEntry.entryName.toString());
    });
    zip.writeZip(name); /* Zip file destination */
    console.log('Backup Sucess')
    /* Compress the folders */
    return 'Sucess'
};

module.exports = {
    World_BAckup: World_BAckup
}