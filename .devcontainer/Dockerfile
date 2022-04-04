FROM debian:latest
ENV DEBIAN_FRONTEND="noninteractive"
RUN \
  apt update && \
  apt install -y git curl wget sudo procps zsh tar screen ca-certificates procps lsb-release xdg-utils g++ libatomic1 libnss3 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libnss3 libgbm-dev

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
RUN \
  mkdir /tmp/Node && NODEURL=""; NODEVERSION=$(wget -qO- https://api.github.com/repos/nodejs/node/releases | grep tag_name | cut -d '"' -f 4 | sort -V | tail -n 1) && \
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
  rm -rf /tmp/node.tar.gz && \
  mkdir /tmp/nodebin && \
  cp -rp /tmp/Node/*/* /tmp/nodebin && \
  rm -rf /tmp/nodebin/LICENSE /tmp/nodebin/*.md && \
  ls -lha /tmp/nodebin && \
  cp -rf /tmp/nodebin/* /usr/ && \
  npm -g install npm@latest

# Install Docker and Docker Compose
RUN curl https://get.docker.com | sh && \
  compose_version="$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d \" -f 4)"; \
  wget -q https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-`uname -s`-`uname -m` -O /usr/local/bin/docker-compose && \
  chmod +x -v /usr/local/bin/docker-compose
VOLUME [ "/var/lib/docker" ]

# Add non root user
ARG USERNAME=gitpod
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN \
  groupadd --gid $USER_GID $USERNAME && \
  adduser --disabled-password --gecos "" --shell /usr/bin/zsh --uid $USER_UID --gid $USER_GID $USERNAME && \
  usermod -aG sudo $USERNAME && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME && \
  chmod 0440 /etc/sudoers.d/$USERNAME && \
  usermod -aG docker $USERNAME

USER $USERNAME
WORKDIR /home/$USERNAME
CMD [ "/usr/bin/zsh" ]

# Install oh my zsh
RUN yes | sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" && \
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting && \
  git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions && \
  sed -e 's|ZSH_THEME=".*"|ZSH_THEME="strug"|g' -i ~/.zshrc && \
  sed -e 's|plugins=(.*)|plugins=(git docker zsh-syntax-highlighting zsh-autosuggestions)|g' -i ~/.zshrc