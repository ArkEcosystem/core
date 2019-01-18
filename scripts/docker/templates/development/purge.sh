#!/usr/bin/env sh

docker stop {token}-development-postgres
docker rm -v {token}-development-postgres
docker volume rm development_postgres
docker network rm development_default
