# Ark Core End-to-end Testing

<p align="center">
    <img src="./img/core-e2e-banner.png" />
</p>

[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](./LICENSE)

## Introduction

E2E tests have not been enabled yet for v3, but you can still launch a network (see below).

## Install and run

You can launch and stop a network like this :

```bash
cd lib/config
docker-compose up -d # launches the network
docker-compose down -v # shuts down the network
```

This will launch a network of 5 nodes on testnet.

You can see the live output of the nodes by using the docker logs command :

```bash
docker logs config_core0_1 -f # for the first node (core0)
```
