FROM ghcr.io/sirherobrine23/mydockerimage:latest
# Install openjdk
RUN apt update && JAVAVERSIONS="$(apt search openjdk|grep '/'|grep 'openjdk-'|sed 's|/| |g'|awk '{print $1}'|grep 'jre'|sed -e 's|-jre.*||g'|uniq)";case $JAVAVERSIONS in   *17* ) apt install -y openjdk-17*;;   *16* ) apt install -y openjdk-16*;;   *) echo "Unsupported Java Version, avaibles"; echo "$JAVAVERSIONS";exit 0;; esac

# Add non root user and Install oh my zsh
ARG USERNAME="devcontainer"
ARG USER_UID="1000"
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME && adduser --disabled-password --gecos "" --shell /usr/bin/zsh --uid $USER_UID --gid $USER_GID $USERNAME && usermod -aG sudo $USERNAME && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME && chmod 0440 /etc/sudoers.d/$USERNAME && usermod -aG docker $USERNAME
USER $USERNAME
WORKDIR /home/$USERNAME
# Set default entrypoint
ENTRYPOINT [ "/usr/local/bin/start.sh" ]
RUN yes | sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" && \
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting && \
  git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions && \
  sed -e 's|ZSH_THEME=".*"|ZSH_THEME="strug"|g' -i ~/.zshrc && \
  sed -e 's|plugins=(.*)|plugins=(git docker kubectl zsh-syntax-highlighting zsh-autosuggestions)|g' -i ~/.zshrc