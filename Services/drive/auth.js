const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const bds =  require('../../index')
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = path.join(bds.server_dir, 'google_token.json');


function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);});
}
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

const CREDENTIAL = require('../../index').google_drive_credential
module.exports.drive_backup = (parent_id) => {
  function upload_backup(auth) {
    const bds_backup = require('../backup').Drive_backup();
    const drive = google.drive({version: 'v3', auth});
    if (parent_id == undefined){var fileMetadata = {'name': bds_backup.file_name,};console.log('Your backup will be saved to My Drive')} else {var fileMetadata = {'name': bds_backup.file_name,parents: [parent_id]};};
    var media = {mimeType: 'application/octet-stream',body: fs.createReadStream(bds_backup.file_dir)};
    drive.files.create({resource: fileMetadata, media: media, fields: 'id'}, function (err, file) {
      if (err) {console.error(err);} else {
        global.backup_id = file.data.id;
        console.log('File: ', file.data.id);}
    });
  }
  return authorize(JSON.parse(CREDENTIAL), upload_backup);
  // End Upload Backup
};

module.exports.mcpe = () => {
  function download_mcpe(auth) {
      const drive = google.drive({version: 'v3', auth});
      var fileId = '11jJjMZRtrQus3Labo_kr85EgtgSVRPLI';
      var dest = fs.createWriteStream(path.join(bds.tmp_dir, 'mcpe.apk'));
      let progress = 0;
      drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},function(err, res){res.data.on('end', () => {console.log('\nDone');}).on('error', err => {console.log('\nError', err)}).on('data', d => {
          progress += d.length / 1024 / 1024;
          if (process.stdout.isTTY) {process.stdout.clearLine();process.stdout.cursorTo(0);process.stdout.write(`Downloaded ${Math.trunc(progress)} Mbytes`);}
      }).pipe(dest)});
  };
  return authorize(JSON.parse(CREDENTIAL), download_mcpe);
}
