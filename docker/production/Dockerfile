FROM node:11-alpine

WORKDIR /home/node/core

ADD docker/production/entrypoint.sh /entrypoint.sh

ARG core_channel=latest

RUN apk add --no-cache --virtual .build-deps make gcc g++ python git \
    && apk add --no-cache bash sudo git openntpd openssl \
    && npm i pm2 -g --loglevel notice \
    && su node -c "yarn global add @arkecosystem/core@${core_channel}" \
    && su node -c "yarn cache clean" \
    && apk del .build-deps \
    && echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

USER node
ENTRYPOINT ["bash", "-c", "/entrypoint.sh \"$@\"", "--"]
