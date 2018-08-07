DOCKER_DB_NAME="$(docker-compose ps -q postgres)"
DB_HOSTNAME=postgres
DB_USER=ark
LOCAL_DUMP_PATH="snapshot.dump"

docker-compose up -d postgres
docker exec -i "${DOCKER_DB_NAME}" pg_restore -C --clean --no-acl --no-owner -U "${DB_USER}" -d "${DB_HOSTNAME}" < "${LOCAL_DUMP_PATH}"
docker-compose stop postgres
