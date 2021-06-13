# Bds Maneger Core

Create manage a server for Minecraft Bedrock, java and derivatives with an integration in NodeJs in which we deliver a versatile REST API for integration with large projects up to independent projects.

Any contribution is welcome, but before a look at [CONTRIBUTING.md](CONTRIBUTING.md), [Bds Manager Core code of conduct](CODE_OF_CONDUCT.md)

## CI/CD tests

[![Github CodeQL and OSSAR](https://github.com/The-Bds-Maneger/Bds-Maneger-Core/actions/workflows/codeql%20and%20ossar%20analysis.yml/badge.svg)](https://github.com/The-Bds-Maneger/Bds-Maneger-Core/actions/workflows/codeql%20and%20ossar%20analysis.yml)
[![Gitlab pipeline status](https://the-bds-maneger.org/The-Bds-Maneger/Bds-Maneger-Core/badges/main/pipeline.svg)](https://the-bds-maneger.org/The-Bds-Maneger/Bds-Maneger-Core/-/pipelines/latest)

[![Total alerts](https://img.shields.io/lgtm/alerts/g/Bds-Maneger/bds_maneger_api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Bds-Maneger/bds_maneger_api/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Bds-Maneger/bds_maneger_api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Bds-Maneger/bds_maneger_api/context:javascript)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/4d19af8fe5b146608a8f4a5e2092f66d)](https://www.codacy.com/gh/The-Bds-Maneger/Bds-Maneger-Core/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=The-Bds-Maneger/Bds-Maneger-Core&amp;utm_campaign=Badge_Grade)
[![DeepScan grade](https://deepscan.io/api/teams/13683/projects/16691/branches/363172/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=13683&pid=16691&bid=363172) 

## Start our Docker image, making everything easier.

Windows:
```cmd
$ docker run --rm -d --name BdsManegerCore -v BdsCore:/home/bds/bds_core ^
    -p 19132:19132/udp -p 19133:19133/udp -p 1932:1932/tcp ^
    -e TELEGRAM_TOKEN="null" ^
    -e DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" ^
    -e WORLD_NAME="Bds Maneger Docker" ^
    -e GAMEMODE="survival" ^
    -e DIFFICULTY="normal" ^
    -e XBOX_ACCOUNT="false" ^
    -e PLAYERS="13" ^
    -e SERVER="bedrock" ^
    -e ENABLE_COMMANDS="false" ^
bdsmaneger/maneger:latest
```

Linux/MacOS:
```bash
$ docker run --rm -d --name BdsManegerCore -v BdsCore/:/home/bds/bds_core \
    -p 19132:19132/udp -p 19133:19133/udp -p 1932:1932/tcp \
    -e TELEGRAM_TOKEN="null" \
    -e DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" \
    -e WORLD_NAME="Bds Maneger Docker" \
    -e GAMEMODE="survival" \
    -e DIFFICULTY="normal" \
    -e XBOX_ACCOUNT="false" \
    -e PLAYERS="13" \
    -e SERVER="bedrock" \
    -e ENABLE_COMMANDS="false"
bdsmaneger/maneger:latest
```

## Options: Static binaries - bin/bds_maneger.js - npx @the-bds-maneger/core

Bds Maneger from version 1.10+ is offering user-ready binary files for Windows, Linux and MacOS systems.

It is still recommended to use docker for x64 architectures (AMD64)

options:

- -s or --start:

    - Start your server, if you haven't installed any it will fail and exit immediately.

- -p or --platform:

    Select a platform to start, install, etc...

    - Available platforms:

        * Bedrock (Oficial)
        * Java (Oficial)
        * PocketMine-MP
        * JSPrismarine

- -d or --server_download:

    - Installation or Update of the server currently selected by the previous option

        - you can also enter a server version, or use `latest` as an option

- -S or --system_info:

    - Server support information, system architecture etc...


## We also have some Implementation Models for Azure

#### Microsoft Azure Container

The Azure container is a special machine for Docker Within Azure, it is fully managed by Azure, it only depends on the Docker image, but it has its limitations.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FBds-Maneger%2FThe-Bds-Maneger-Docker%2Fmain%2Fazure%2FBdsMangerCore_docker.json)

#### Microsoft Azure Virtual machine

Here we have a virtual machine totally dedicated to Bds Maneger Core, it still uses Docker to deploy Docker images.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FThe-Bds-Maneger%2FAzure_VMs%2Fmain%2Fdeploy.json)

More Information Access the repository: [Azure VMs](https://github.com/The-Bds-Maneger/Azure_VMs)
