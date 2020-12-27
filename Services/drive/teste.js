var {google}  = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const stream = require('stream');
const serviceAccount =  require('../config/node-uploader-99-9e3f13fd0cde.json')
console.log(serviceAccount);
let fileObject = req.body.filePDF;
console.log(fileObject);
let bufferStream = new stream.PassThrough();
bufferStream.end(fileObject.buffer);
    const jWTClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']
    )
    google.drive({ version: 'v3'})
    .files.create({
        auth: GoogleAuth/jWTClient,
        media: {
            mimeType: 'application/pdf',
            body: bufferStream
        },
        resource: {
            name: 'DeniTheFile.pdf',
            // if you want to store the file in the root, remove this parents
            parents: ['1KwLSHyu9R1jo3-ahtWgJCohoCsrtrE-I']
        },
        fields: 'id',
    }).then(function (resp) {
        console.log(resp,'resp');
    }).catch(function (error) {
        console.log(error);
    })
res.send('File uploaded');
// });