# Bds Core

## 1.8.3

* Google Drive has been separated into two files (GoogleDrive.js, GoogleDriveAuth.js)

* The backups of the worlds have been unified to a single script.

* the string `electron` has been removed, now the scripts that need it will have to use `process.argv[0].includes("electron")`.

## 1.7.0

* In this version we have minor modifications in downloads.js to skip the installation if it is already installed.

* The docker core image is now part of the core repository, and some modifications have been made to the docker image. more changes are planned for the next commit

* some errors can still occur if the new configuration file is not updated, and this will have to be done manually

## 1.6.2

* a new configuration was added in bds_config.json to control the ram memory in java (the default value set will be what is available when creating the first bds_config.json).

* a new command was added to update the java ram saved in bds_config.json.

* Now bds_config.json will be updated with each version of the core that is made available.

* Now Google Drive Upload backup use fetch directly in the module and no longer in index.js

* auth.js has been renamed to GoogleDrive.js

* the backup script has been fixed

## 1.6.1

* new download method.

* the bds_users.json script has been updated, now the time when the player entered and left the server will be added.

* the API has been merged into a single file, and now you will have to manually call the api. with api.log () and api.api () // api ().

* the bds_maneger in the bin/ folder has been modified to call the api and an outgoing message from the server when calling the "stop" command.

## 1.6.0

* New variables have been added to index.js.

* the index.js now check the bds_user.json.

* now users who connect to the server will be saved in bds_user.json within the root of the servers files.

* in the next commit it will be necessary to activate the API via express.js manually.

## 1.5.5

System monitor update:
-   now we can get as much ram as is being used by java and bedrock servers

The old scripts in the global folder have been moved to the scripts folder, and where all the new scripts are currently located.

API update;
-   We didn't have many updates to the script, just a touch up
-   Some features are being planned to be added

## 1.5.0

All scripts have been rewritten some features are still under maintenance

The Docker image has returned to work in the new version.

Some functions will be modified or removed from the next version in the Stable branch

## 1.4.2

Docker test fix

## 1.4.1

Docker test fix

## 1.4.0

Changes to the code base

Some scripts have been merged again for future maintenance.

An issue persists when starting the Docker Image, wait for the next API updates.
