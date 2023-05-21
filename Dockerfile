FROM node:lts
WORKDIR /app
COPY ./ ./
RUN npm install --no-save && npm run -w "@the-bds-maneger/web" build

FROM node:lts
WORKDIR /app
COPY --from=0 /app/package/docker ./
RUN npm install
EXPOSE 3000:3000/tcp
ENV PORT=3000
VOLUME [ "/data" ]
ENTRYPOINT "bash -c 'BDSCOREROOT=/data node src/index.js'"