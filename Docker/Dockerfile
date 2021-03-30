FROM ubuntu:rolling
USER root
ENV DEBIAN_FRONTEND=noninteractive

RUN \
echo "Arch: $(uname -m)"; \
apt update && \
apt install -y git curl openjdk-14-jdk openjdk-14-jre wget jq sudo unzip zip screen $(case $(uname -m) in "x86_64") echo "";; *) echo "qemu-user-static binfmt-support";; esac) nginx > /dev/null && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* /tmp/* && \
mkdir -p /home/bds/ && curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && apt install -y nodejs > /dev/null && rm -rfv /etc/nginx/sites-available/default

# Copy Files
COPY ./Docker/base/ /base/
COPY ./Docker/etc/ /etc/
COPY ./ /opt/bdsCore/
RUN cd /opt/bdsCore/ && npm i --no-save
ENV TELEGRAM_TOKEN="null" DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" \
WORLD_NAME="Bds Maneger Docker" GAMEMODE="survival" DIFFICULTY="normal" XBOX_ACCOUNT="false" PLAYERS="13" \
BDS_VERSION="latest" SERVER="bedrock" BDS_REINSTALL="true" Docker_Debug_Script="false" \
ngrok_token=""

RUN mkdir -p /home/bds/.config/bds_core
EXPOSE 80/tcp 19132/udp 19133/udp
ENV BDS_DOCKER_IMAGE="true" HOME="/home/bds/"

# Entrypint
WORKDIR /home/bds/
RUN chmod +x /base/init.sh
ENTRYPOINT ["/base/init.sh"]
