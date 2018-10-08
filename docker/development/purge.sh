#!/usr/bin/env sh

docker stop ark-development-postgres ark-development-redis
docker rm -v ark-development-postgres ark-development-redis
docker volume rm development_postgres development_redis
docker network rm development_default
