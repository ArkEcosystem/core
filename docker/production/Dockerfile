FROM node:11-alpine

WORKDIR /home/node/core

ADD docker/production/entrypoint.sh /entrypoint.sh

COPY ./ /home/node/core

RUN apk add --no-cache --virtual .build-deps make gcc g++ python git \
    && apk add --no-cache bash sudo git openntpd openssl \
    && echo "servers pool.ntp.org" > /etc/ntpd.conf \
    && echo "servers time.google.com" >> /etc/ntpd.conf \
    && npm i pm2 -g --loglevel notice \
    && yarn setup \
    && yarn cache clean \
    && apk del .build-deps \
    && echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

USER node
ENTRYPOINT ["bash", "-c", "/entrypoint.sh \"$@\"", "--"]
