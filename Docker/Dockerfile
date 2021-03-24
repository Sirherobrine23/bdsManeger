FROM bdsmaneger/node_image:latest
USER root

ENV DEBIAN_FRONTEND=noninteractive
RUN uname -m; apt update && apt install -y git curl wget jq sudo $(case $(uname -m) in "x86_64") echo "";; *) echo "qemu-user-static binfmt-support";; esac) && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* /tmp/* && mkdir -p /home/bds/

# Copy Files
COPY ./Docker/base/ /base/
COPY ./ /opt/bdsCore/
RUN cd /opt/bdsCore/ && npm i --no-save

RUN mkdir -p /home/bds/.config/bds_maneger_api

ENV TELEGRAM_TOKEN="null" DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" WORLD_NAME="Bds Maneger Docker" GAMEMODE="survival" DIFFICULTY="normal" XBOX_ACCOUNT="false" PLAYERS="13" BDS_VERSION="latest" SERVER="bedrock" BDS_REINSTALL="true" Docker_Debug_Script="false"

# Main config
EXPOSE 1932/tcp 6565/tcp 19132/udp 19133/udp
ENV BDS_DOCKER_IMAGE="true" HOME="/home/bds/"

# Entrypint
WORKDIR /home/bds/
RUN chmod +x /base/init.sh
ENTRYPOINT ["/base/init.sh"]
