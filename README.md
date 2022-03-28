# Bds Maneger Core

This is a small hub to manage various servers for Minecraft Bedrock and for Minecraft Java, such as installing, starting and keeping up to date with the latest version available.

This module is fully compatible with ESM, CJS and Typescript.

## Requirements

This module requires some requirements to work:

* NodeJS: `^15.x`.
* Java: `^8.0` or OpenJDK: `^16`.

### For Windows Users

Minecraft Bedrock needs Visual studio C++ if you are using Windows Server ([More information you can find on the Wiki](<https://github.com/The-Bds-Maneger/Bds-Maneger-Core/wiki/Server-Platforms#minecraft-bedrock-server-alpha>)).

## CLI

This module also includes a simple CLI for managing servers. how:

1. Download compatible server versions.
2. Update the server.
3. Start the server.
4. Backup Server.

## Install

To install CLI: `npm install -g @the-bds-maneger/core` (`Linux user Use sudo or root`).

To Install module: `npm install @the-bds-maneger/core`.

Run withou install: `npx @the-bds-maneger/core`.

## Docker and Docker Compose

### Docker Compose

[Docker Compose releases](<https://github.com/docker/compose/releases/latest>).

* MacOS and Windows docker users is already installed by default in Docker Desktop.

```yml
version: "3.9"
volumes:
  server_storage:
services:
  bdscore:
    image: ghcr.io/the-bds-maneger/core:latest
    volumes:
      - server_storage:/data
    environment:
      # Server Settings
      DESCRIPTION: "My Sample Server"
      WORLD_NAME: "My Map"
      GAMEMODE: "survival"
      DIFFICULTY: "normal"
      MAXPLAYERS: "5"
      REQUIRED_LOGIN: "false"
      # Bds Core Settings
      VERSION: "latest"
      PLATFORM: "bedrock"
    ports:
      # Port to API
      - 3000:3000/tcp
      # Server Port to bedrock
      - 19132:19132/udp
      - 19133:19133/udp
      # Server Port to java
      - 25565:25565/tcp
      - 25565:25565/udp
```

### Docker

create Docker volume: `docker volume create --driver local --name bds_server_storage`.

run image:

```bash
docker run --rm -d \
--name=bdscore \
-v bds_server_storage:/data \
-p 25565:25565/udp \
-p 25565:25565/tcp \
-p 19132:19132/udp \
-p 19133:19133/udp \
-p 3000:3000/tcp \
-e DESCRIPTION="My Sample Server" \
-e WORLD_NAME="My Map" \
-e GAMEMODE="survival" \
-e DIFFICULTY="normal" \
-e MAXPLAYERS="5" \
-e REQUIRED_LOGIN="false" \
-e VERSION="latest" \
-e PLATFORM="bedrock" \
ghcr.io/the-bds-maneger/core:latest
```

Get log: `docker logs bdscore`.
