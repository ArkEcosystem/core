#!/usr/bin/env bash

docker stop ark-devnet-postgres ark-devnet-core
docker rm -v ark-devnet-postgres ark-devnet-core
docker volume rm devnet_ark-core devnet_postgres
docker network rm devnet_default
