FROM debian:latest AS bdscore
LABEL org.opencontainers.image.title="Bds Maneger Docker"
LABEL org.opencontainers.image.description="Start Minecraft Server with Docker containers and Auto Control Server wirh Bds Maneger Core."
LABEL org.opencontainers.image.vendor="Sirherobrine23"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/The-Bds-Maneger/Bds-Maneger-Core.git"
CMD [ "/bin/bash", "-c" ]
ENV DEBIAN_FRONTEND="noninteractive"
RUN \
  apt update && \
  apt install -y git curl wget sudo procps zsh tar screen ca-certificates procps lsb-release && \
  apt install -y xdg-utils g++ \
  libatomic1 libnss3 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libnss3 libgbm-dev

# Install openjdk
RUN \
  apt update && \
  JAVAVERSIONS="$(apt search openjdk|grep '/'|grep 'openjdk-'|sed 's|/| |g'|awk '{print $1}'|grep 'jre'|sed -e 's|-jre.*||g'|uniq)";\
  case $JAVAVERSIONS in \
    *17* ) apt install -y openjdk-17*;; \
    *16* ) apt install -y openjdk-16*;; \
    *) echo "Unsupported Java Version, avaibles"; echo "$JAVAVERSIONS";exit 0;; \
  esac

# Install latest node
RUN VERSION=$(wget -qO- https://api.github.com/repos/Sirherobrine23/DebianNodejsFiles/releases/latest |grep 'name' | grep "nodejs"|grep "$(dpkg --print-architecture)"|cut -d '"' -f 4 | sed 's|nodejs_||g' | sed -e 's|_.*.deb||g'|sort | uniq|tail -n 1); wget -q "https://github.com/Sirherobrine23/DebianNodejsFiles/releases/download/debs/nodejs_${VERSION}_$(dpkg --print-architecture).deb" -O /tmp/nodejs.deb && dpkg -i /tmp/nodejs.deb && rm -rfv /tmp/nodejs.deb && npm install -g npm@latest

RUN \
case $(uname -m) in \
  x86_64 ) echo "Dont Install libries";exit 0;; \
  * ) apt update; apt install -y qemu-user-static unzip; wget -q "https://github.com/The-Bds-Maneger/external_files/raw/main/Linux/libs_amd64.zip" -O /tmp/tmp.zip; unzip -o /tmp/tmp.zip -d /; rm -rfv /tmp/tmp.zip; apt remove -y --purge unzip;; \
esac

# Create Volume to Storage Server
VOLUME [ "/data" ]

# App Workspace
STOPSIGNAL SIGTERM
ENTRYPOINT [ "node", "--trace-warnings", "dist/cjs/bin/docker.js" ]

# Ports
EXPOSE 3000/tcp
EXPOSE 19132/udp
EXPOSE 19133/udp
EXPOSE 25565/tcp
EXPOSE 25566/tcp

# Default ENVs
ENV WORLD_STORAGE="/data/worlds"
ENV BACKUP_PATH="/data/backups"
ENV LOG_PATH="/data/logs"
ENV EXTRA_PATH="/data/extra"

# Server Settings
ENV DESCRIPTION="My Sample Server"
ENV WORLD_NAME="My Map"
ENV GAMEMODE="survival"
ENV DIFFICULTY="normal"
ENV MAXPLAYERS="5"
ENV REQUIRED_LOGIN="false"
ENV ALLOW_COMMADS="false"

# Bds Core Settings
ENV VERSION="latest"
ENV PLATFORM="bedrock"
ENV AUTH_USER="admin"
ENV AUTH_PASSWORD="admin"

STOPSIGNAL SIGTERM
WORKDIR /var/app_storage
COPY package*.json ./
RUN npm install
COPY ./ ./
RUN npm run build:cjs
