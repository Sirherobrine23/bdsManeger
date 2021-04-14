# Bds Maneger Core

Deploy a Minecarft server easily with various features made available by our REST API, along with a GUI available to control the entire server, both locally and remotely, along with powerful and versatile technology.

For now we are in a version qualified for general use and implementations in complete azure.

## CI/CD tests

[![CodeQL](https://github.com/Bds-Maneger/bds_maneger_api/workflows/CodeQL/badge.svg)](https://github.com/The-Bds-Maneger/core/actions/workflows/codeql-analysis.yml) [![Total alerts](https://img.shields.io/lgtm/alerts/g/Bds-Maneger/bds_maneger_api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Bds-Maneger/bds_maneger_api/alerts/) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Bds-Maneger/bds_maneger_api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Bds-Maneger/bds_maneger_api/context:javascript) [![Codacy Badge](https://app.codacy.com/project/badge/Grade/4d19af8fe5b146608a8f4a5e2092f66d)](https://www.codacy.com/gh/Bds-Maneger/bds_maneger_api/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Bds-Maneger/bds_maneger_api&amp;utm_campaign=Badge_Grade)[![DeepScan grade](https://deepscan.io/api/teams/13683/projects/16691/branches/363172/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=13683&pid=16691&bid=363172) 

## Known issues in Windows

* The first start-up should be done as an Administrator, as he will try to create a Syslink on the Desktop, if you do not use Node in a managed mode it crashes and does not execute the next procedures.

## Start our Docker image, making everything easier.

Windows:
```cmd
$ docker run --rm -d --name BdsManegerCore -v &USERPROFFILE&\bds_core\:/home/bds/bds_core ^
    -p 19132:19132/udp -p 19133:19133/udp -p 1932:1932/tcp ^
    -e TELEGRAM_TOKEN="null" ^
    -e WORLD_NAME="World name" ^
    -e DESCRIPTION="This is not simple" ^
    -e GAMEMODE="survival" ^
    -e DIFFICULTY="normal" ^
    -e PLAYERS="13" ^
    -e SERVER="bedrock" ^
    -e BDS_REINSTALL="true" ^
    -e BDS_VERSION="latest" ^
bdsmaneger/maneger:latest
```

Linux/MacOS:
```bash
$ docker run --rm -d --name BdsManegerCore -v ~/bds_core/:/home/bds/bds_core \
    -p 19132:19132/udp -p 19133:19133/udp -p 1932:1932/tcp \
    -e TELEGRAM_TOKEN="null" \
    -e WORLD_NAME="World name" \
    -e DESCRIPTION="This is not simple" \
    -e GAMEMODE="survival" \
    -e DIFFICULTY="normal" \
    -e PLAYERS="13" \
    -e SERVER="bedrock" \
    -e BDS_REINSTALL="true" \
    -e BDS_VERSION="latest" \
bdsmaneger/maneger:latest
```

## We also have some Implementation Models for Azure

#### Microsoft Azure Container

The Azure container is a special machine for Docker Within Azure, it is fully managed by Azure, it only depends on the Docker image, but it has its limitations.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FBds-Maneger%2FThe-Bds-Maneger-Docker%2Fmain%2Fazure%2FBdsMangerCore_docker.json)

#### Microsoft Azure Virtual machine

Here we have a virtual machine totally dedicated to Bds Maneger Core, it still uses Docker to deploy Docker images.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FThe-Bds-Maneger%2FAzure_VMs%2Fmain%2Fdeploy.json)

More Information Access the repository: [Azure VMs](https://github.com/The-Bds-Maneger/Azure_VMs)
