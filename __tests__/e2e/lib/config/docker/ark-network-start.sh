echo "Starting ark --network-start" >> output.log
CORE_DB_HOST=postgres CORE_DB_DATABASE=ark_testnet CORE_DB_USERNAME=ark ARK_LOG_FILE=ark.log CORE_PATH_CONFIG=./packages/core/bin/config/testnet CORE_PATH_DATA=./packages/core/bin/config/testnet ./packages/core/bin/run core:run --networkStart >> output.log 2> errors.log
echo "Started ark --network-start" >> output.log