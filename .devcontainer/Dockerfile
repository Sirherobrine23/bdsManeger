FROM debian:latest
ARG DEBIAN_FRONTEND="noninteractive"
RUN apt update && apt install -y git curl wget sudo procps zsh tar screen ca-certificates procps lsb-release xdg-utils g++ gconf-service gpg

# Install node.js
RUN wget $(wget -qO- https://api.github.com/repos/Sirherobrine23/DebianNodejsFiles/releases | grep 'browser_download_url' | grep "$(dpkg --print-architecture)" | cut -d '"' -f 4 | sort | uniq | tail -n 1) -q -O /tmp/nodejs.deb && dpkg -i /tmp/nodejs.deb && rm -rfv /tmp/nodejs.deb && npm install -g npm@latest

# Install Docker and Docker Compose
VOLUME [ "/var/lib/docker" ]
RUN wget -qO- https://get.docker.com | sh && \
  wget -q $(wget -qO- https://api.github.com/repos/docker/compose/releases | grep 'browser_download_url' | grep -v '.sha' | grep $(uname -s) | grep $(uname -m) | cut -d '"' -f 4 | sort | tail -n1)\
  -O /usr/local/bin/docker-compose && chmod +x -v /usr/local/bin/docker-compose

# Install openjdk
RUN apt update && \
  JAVAVERSIONS="$(apt search openjdk|grep '/'|grep 'openjdk-'|sed 's|/| |g'|awk '{print $1}'|grep 'jre'|sed -e 's|-jre.*||g'|uniq)";\
  case $JAVAVERSIONS in \
    *17* ) apt install -y openjdk-17*;; \
    *16* ) apt install -y openjdk-16*;; \
    *) echo "Unsupported Java Version, avaibles"; echo "$JAVAVERSIONS";exit 0;; \
  esac

# Create docker and minikube start script
ARG DOCKERD_ARGS="--experimental"
RUN (echo '#''!/bin/bash';\
  echo 'EXISTDOCKER="1"';\
  echo "if command -v dockerd &> /dev/null; then";\
  echo '  if ! [[ -f "/var/run/docker.sock" ]];then';\
  echo "    (sudo dockerd ${DOCKERD_ARGS}) &";\
  echo "    sleep 5s";\
  echo "  fi";\
  echo "else";\
  echo '  EXISTDOCKER="0"';\
  echo "fi";\
  echo "";\
  echo "# Run script";\
  echo 'if ! [[ -z "\$@" ]]; then';\
  echo '  sh -c "\$@"';\
  echo "fi";\
  echo "";\
  echo "# Check docker is running";\
  echo 'if [[ "\${EXISTDOCKER}" == "0" ]];then';\
  echo "  while true; do";\
  echo "    if ! (docker info &> /dev/null) || ps -ef | grep -v grep | grep -q dockerd; then";\
  echo '      echo "Dockerd stopped"';\
  echo "      break";\
  echo "    fi";\
  echo "    sleep 4s";\
  echo "  done";\
  echo "fi";\
  echo "";\
  echo "# Sleep script";\
  echo "sleep infinity";\
  echo "exit") | tee /usr/local/bin/start.sh && chmod a+x /usr/local/bin/start.sh

# Add non root user
ARG USERNAME="devcontainer"
ARG USER_UID="1000"
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME && \
  adduser --disabled-password --gecos "" --shell /usr/bin/zsh --uid $USER_UID --gid $USER_GID $USERNAME && \
  usermod -aG sudo $USERNAME && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME && \
  chmod 0440 /etc/sudoers.d/$USERNAME && usermod -aG docker $USERNAME
USER $USERNAME
WORKDIR /home/$USERNAME

# Set default entrypoint
ENTRYPOINT [ "/usr/local/bin/start.sh" ]

# Install oh my zsh
RUN yes | sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" && \
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting && \
  git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions && \
  sed -e 's|ZSH_THEME=".*"|ZSH_THEME="strug"|g' -i ~/.zshrc && sed -e 's|plugins=(.*)|plugins=(git docker zsh-syntax-highlighting zsh-autosuggestions)|g' -i ~/.zshrc