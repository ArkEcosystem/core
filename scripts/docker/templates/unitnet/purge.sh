#!/usr/bin/env sh

docker stop {token}-unitnet-postgres
docker rm -v {token}-unitnet-postgres
docker volume rm unitnet_postgres
docker network rm unitnet_default
