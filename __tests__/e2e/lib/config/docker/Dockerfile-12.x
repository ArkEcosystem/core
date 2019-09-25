FROM node:12

WORKDIR /ark-core

COPY  entrypoint.sh /

RUN apt-get update && \
    apt-get -y install --no-install-recommends \
    build-essential \
    jq \
    iptables \
    python \
    vim && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 4000 4003

