# Import lts node
FROM node:lts
WORKDIR /build
COPY ../../. ./
RUN npm i -g typescript && npm install --no-save && npm -w ./package/docker run build

# Tiny image
FROM node:lts-alpine
WORKDIR /app
COPY --from=0 /build ./
RUN npm link /app/package/docker
ENTRYPOINT [ "bash", "-c", "bdscoreroot=/data bdsdocker" ]