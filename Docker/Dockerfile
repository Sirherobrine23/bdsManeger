FROM bdsmaneger/node_image:latest
USER root
ENV DEBIAN_FRONTEND=noninteractive

RUN \
echo "Arch: $(uname -m)"; \
apt update && \
apt install -y git curl openjdk-14-jdk openjdk-14-jre wget jq sudo unzip zip screen nginx python make build-essential $(case $(uname -m) in "x86_64") echo "";; *) echo "qemu-user-static binfmt-support";; esac) && \
case $(uname -m) in "x86_64") echo "";; \
*) wget https://raw.githubusercontent.com/The-Bds-Maneger/Raw_files/main/linux_libries.zip -O /tmp/libries.zip && unzip /tmp/libries.zip -d / && rm -rfv /tmp/libries.zip ;; \
esac ;\
rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* /tmp/* && \
mkdir -p /home/bds/ && rm -rfv /etc/nginx/sites-*/default

ENV \
TELEGRAM_TOKEN="null" \
DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" \
WORLD_NAME="Bds Maneger Docker" \
GAMEMODE="survival" \
DIFFICULTY="normal" \
XBOX_ACCOUNT="false" \
PLAYERS="13" \
BDS_VERSION="latest" \
SERVER="bedrock" \
BDS_REINSTALL="true" \
Docker_Debug_Script="false"
EXPOSE 80/tcp 19132/udp 19133/udp
ENV BDS_DOCKER_IMAGE="true" HOME="/home/bds/"

# Copy Files
COPY ./Docker/root_path/ /
COPY ./ /opt/bdsCore/
RUN cd /opt/bdsCore/ && npm install --no-save

RUN mkdir -p /home/bds/.config/bds_core

# Entrypint
WORKDIR /home/bds/
RUN chmod +x /base/init.sh
ENTRYPOINT ["/base/init.sh"]
