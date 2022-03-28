FROM debian:latest AS nodedowload
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt update && apt -y install wget tar lsb-release

# Install latest docker image
RUN mkdir /tmp/Node && NODEURL=""; NODEVERSION=$(wget -qO- https://api.github.com/repos/nodejs/node/releases | grep tag_name | cut -d '"' -f 4 | sort -V | tail -n 1) && \
case $(uname -m) in \
  x86_64 ) NODEURL="https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-x64.tar.gz";; \
  aarch64 ) NODEURL="https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-arm64.tar.gz";; \
  armv7l ) NODEURL="https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-armv7l.tar.gz";; \
  ppc64le ) NODEURL="https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-ppc64le.tar.gz";; \
  s390x ) NODEURL="https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-s390x.tar.gz";; \
  *) echo "Unsupported architecture ($(uname -m))"; exit 1;; \
esac && \
echo "Node bin Url: ${NODEURL}"; wget -q "${NODEURL}" -O /tmp/node.tar.gz && \
tar xfz /tmp/node.tar.gz -C /tmp/Node && \
mkdir /tmp/nodebin && cp -rp /tmp/Node/*/* /tmp/nodebin && ls /tmp/nodebin && rm -rfv /tmp/nodebin/LICENSE /tmp/nodebin/*.md

FROM debian:latest AS libries
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt update && apt -y install wget unzip zip
RUN mkdir -p /libries; mkdir /libries/lib64; \
if [ "$(uname -m)" != "x86_64" ];then \
  apt install -y qemu-user-static; \
  wget -q "https://github.com/The-Bds-Maneger/external_files/raw/main/Linux/libs_amd64.zip" -O /tmp/libries.zip; \
  unzip -o /tmp/libries.zip -d /libries; \
  rm -rfv /tmp/libries.zip; \
fi

FROM debian:latest AS bdscore
LABEL org.opencontainers.image.title="Bds Maneger Docker"
LABEL org.opencontainers.image.description="Start Minecraft Server with Docker containers and Auto Control Server wirh Bds Maneger Core."
LABEL org.opencontainers.image.vendor="Sirherobrine23"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/The-Bds-Maneger/Bds-Maneger-Core.git"

# Install external Libries to another architecture
COPY --from=libries /libries/ /
# Install NodeJS and latest NPM
COPY --from=nodedowload /tmp/nodebin/ /usr
RUN npm -g install npm@latest

# Install Core Packages
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt update && \
  apt install -y procps ca-certificates procps lsb-release xdg-utils g++ libatomic1 libnss3 \
  libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libnss3 libgbm-dev

# Install openjdk
RUN apt update && \
  JAVAVERSIONS="$(apt search openjdk|grep '/'|grep 'openjdk-'|sed 's|/| |g'|awk '{print $1}'|grep 'jre'|sed -e 's|-jre.*||g'|uniq)";\
  case $JAVAVERSIONS in \
    *17* ) apt install -y openjdk-17*;; \
    *16* ) apt install -y openjdk-16*;; \
    *) echo "Unsupported Java Version, avaibles"; echo "$JAVAVERSIONS";exit 0;; \
  esac

# Create Volume to Storage Server
VOLUME [ "/data" ]

# App Workspace
WORKDIR /app
ENTRYPOINT [ "node", "--trace-warnings", "/app/dist/cjs/bin/docker.js" ]

# Ports
EXPOSE 3000/tcp
EXPOSE 19132/udp
EXPOSE 19133/udp
EXPOSE 25565/tcp
EXPOSE 25566/tcp

# Default ENVs
ENV NODE_ENV="production"
ENV SERVER_PATH="/data/server"
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

COPY package*.json ./
RUN npm install --no-save
COPY ./ ./
RUN npm run build:cjs
