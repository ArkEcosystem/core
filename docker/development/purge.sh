#!/usr/bin/env sh

docker stop phantom-development-postgres
docker rm -v phantom-development-postgres
docker volume rm development_postgres
docker network rm development_default
