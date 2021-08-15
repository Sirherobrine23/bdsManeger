# Setup Bds Manerger Project Docker Base
FROM debian:testing AS bdsbase
USER root
ENV DEBIAN_FRONTEND="noninteractive" DOCKER_IMAGE="true"

# Copy Docker Files
COPY .Build/Docker/* /tmp

# Configure BASE
RUN bash /tmp/Configure.sh

# Setup bdsmaneger/core
FROM bdsbase AS bdscore

RUN mkdir -vp /home/thebds/bds_core && chmod -Rv 7777 /home; chown thebds:thebds -Rv /home


# Create Volume to Storage Server And Config
VOLUME [ "/home/thebds/bds_core" ]

# Copy Bds Maneger Core
WORKDIR /home/backend_core_scripts/

# Install Core dependencies
COPY --chown=thebds:thebds package*.json ./
RUN npm install

# Copy BdsManger Core
COPY --chown=thebds:thebds ./ ./
RUN chmod a+x -v bin/*

# Set Non Root User
USER thebds

# Set default ENVs to Bds Core
ENV PLAYERS="5" \
    WORLD_NAME="The Ultimate Server" \
    DESCRIPTION="running Minecraft Server on Bds Maneger by Bds Manager Project" \
    GAMEMODE="survival" \
    DIFFICULTY="normal" \
    ENABLE_COMMANDS="false" \
    ACCOUNT="false" \
    SERVER="bedrock" \
    UPDATE_SERVER="true"

# Bds Maneger Core required ports
EXPOSE 19132/udp 19133/udp 1932/tcp

# Set Entrypint
ENTRYPOINT [ "node", "./bin/Docker.js" ]
