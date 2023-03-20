FROM node:lts
WORKDIR /app
COPY ./ ./
RUN npm install --no-save && npm run build
EXPOSE 3000:3000/tcp
ENV PORT=3000
VOLUME [ "/data" ]
ENTRYPOINT "bash -c 'BDSCOREROOT=/data node src/index.js'"