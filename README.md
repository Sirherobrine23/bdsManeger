# Bds Maneger Core

Bds Maneger Core is a javascript core in Nodejs that manages several types of server seftware for Minecraft Bedrock and Java. Bds Maneger Core has integrated with a REST API with full integration with Bds Maneger Core in addition to CLI and One bot versions for the telegram.

Any contribution is welcome, but before a look at [CONTRIBUTING.md](CONTRIBUTING.md), [Bds Manager Core code of conduct](CODE_OF_CONDUCT.md)

## Requirements for Bds Maneger Core

### All

* [Nodejs 14+](https://nodejs.org/en/download/)
* [OpenJDK 16+](https://www.oracle.com/java/technologies/javase-jdk16-downloads.html)

### Windows 10+

* [Microsoft Visual Studio C++ (The Bds Maneger Documentation)](<https://docs.bdsmaneger.com/docs/Bds Maneger core/WindowsFixDll/#windows-server>)

## Documentation

We have a separate repository for all Bds Maneger Project documentation, [link here from the main page](<https://docs.bdsmaneger.com/Bds Maneger core>), [Repository link](https://github.com/The-Bds-Maneger/Bds-Manager-Project-Documentation)

## Badges

[![Github CodeQL and OSSAR](https://github.com/The-Bds-Maneger/Bds-Maneger-Core/actions/workflows/codeql%20and%20ossar%20analysis.yml/badge.svg)](https://github.com/The-Bds-Maneger/Bds-Maneger-Core/actions/workflows/codeql%20and%20ossar%20analysis.yml)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/Bds-Maneger/bds_maneger_api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Bds-Maneger/bds_maneger_api/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Bds-Maneger/bds_maneger_api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Bds-Maneger/bds_maneger_api/context:javascript)
[![DeepScan grade](https://deepscan.io/api/teams/13683/projects/16691/branches/363172/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=13683&pid=16691&bid=363172)

## Start Bds Maneger Core with npx

### CLI

All options can be found in the bds maneger core documentation.

`npx --package=@the-bds-maneger/core@latest bds_maneger -sk`

### Telegram Bot

`npx --package=@the-bds-maneger/core@latest bds_telegram`

## Install Bds Maneger Core globally

The commands available after installation:

* bds_maneger
* bds_telegram

`npm i -g @the-bds-maneger/core@latest`

## Launch Bds Maneger Core with a docker image

### Windows

```cmd
docker run --rm -d --name BdsManegerCore -v BdsCore:/home/bds/bds_core ^
    --restart=always -p 19132:19132/udp -p 19133:19133/udp -p 1932:1932/tcp ^
    -e DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" ^
    -e WORLD_NAME="Bds Maneger Docker" ^
    -e GAMEMODE="survival" ^
    -e DIFFICULTY="normal" ^
    -e ACCOUNT="false" ^
    -e PLAYERS="13" ^
    -e SERVER="bedrock" ^
    -e ENABLE_COMMANDS="false" ^
ghcr.io/the-bds-maneger/core:latest
```

### Linux/MacOS

```bash
docker run --rm -d --name BdsManegerCore -v BdsCore/:/home/bds/bds_core \
    --restart=always -p 19132:19132/udp -p 19133:19133/udp -p 1932:1932/tcp \
    -e DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" \
    -e WORLD_NAME="Bds Maneger Docker" \
    -e GAMEMODE="survival" \
    -e DIFFICULTY="normal" \
    -e ACCOUNT="false" \
    -e PLAYERS="13" \
    -e SERVER="bedrock" \
    -e ENABLE_COMMANDS="false" \
ghcr.io/the-bds-maneger/core:latest
```

## Azure Container and Azure VM

We've separate the repository for azure deploy templates, [go here](https://github.com/The-Bds-Maneger/Azure#azure-deploys) if you want to deploy to azure.

## Oracle Cloud

soon!
