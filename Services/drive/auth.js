module.exports.drive_backup = (parent_id) => {
  const fs = require('fs');
  const readline = require('readline');
  const {google} = require('googleapis');

  const SCOPES = ['https://www.googleapis.com/auth/drive'];
  const TOKEN_PATH = __dirname+'/token.json';

  fs.readFile(__dirname+'/credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), listFiles);
  });


  function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
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
  function listFiles(auth) {
    const bds_backup = require('../backup').Drive_backup()
    const drive = google.drive({version: 'v3', auth});
    if (parent_id == undefined){
      var fileMetadata = {
        'name': bds_backup.file_name,
      };
      console.log('Your backup will be saved to My Drive')
    } else {
      var fileMetadata = {
        'name': bds_backup.file_name,
        parents: [parent_id]
      };
    };
    var media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(bds_backup.file_dir)
    };
    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    }, function (err, file) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        global.backup_id = file.data.id;
        console.log('File: ', file.data.id);
      }
    });
  }
  return 'Use backup_id para ter o id do ultimo arquivo'
}; /*End*/