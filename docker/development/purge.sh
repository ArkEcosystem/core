#!/usr/bin/env sh

docker stop ark-development-postgres
docker rm -v ark-development-postgres
docker volume rm development_postgres
docker network rm development_default
