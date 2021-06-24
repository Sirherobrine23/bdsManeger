const { CronJob } = require("cron");
const { GetCronBackup } = require("../lib/BdsSettings");
const { Backup } = require("./backups")
const Cloud = {
    Azure: require("../clouds/Azure").Uploadbackups,
    Driver: require("../clouds/GoogleDriver").Uploadbackups,
    Oracle: require("../clouds/OracleCI").Uploadbackups,
}

const CurrentBackups = GetCronBackup();
const Scheduled_Cron = []
for (let Crron of CurrentBackups) {
    Scheduled_Cron.push(new CronJob(Crron.cron, function(){
        console.log("Starting Server and World Backup");
        const CurrentBackup = Backup();
        if (Crron.Azure) Cloud.Azure(CurrentBackup.file_name, CurrentBackup.file_path)
        if (Crron.Driver) Cloud.Driver(CurrentBackup.file_name, CurrentBackup.file_path)
        if (Crron.Oracle) Cloud.Oracle(CurrentBackup.file_name, CurrentBackup.file_path)
    }))
}

module.exports = Scheduled_Cron