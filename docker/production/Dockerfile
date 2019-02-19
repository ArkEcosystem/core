FROM node:10-alpine

WORKDIR /home/node/core

ADD docker/production/entrypoint.sh /entrypoint.sh

COPY ./ /home/node/core

RUN apk add --no-cache --virtual .build-deps make gcc g++ python git \
    && apk add --no-cache bash sudo git openntpd openssl \
    && npm i pm2 -g --loglevel notice \
    && yarn global add @arkecosystem/core@beta \
    && yarn cache clean \
    && apk del .build-deps \
    && echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

USER node
ENTRYPOINT ["bash", "-c", "/entrypoint.sh \"$@\"", "--"]
