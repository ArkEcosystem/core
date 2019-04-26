echo "Starting ark" >> output.log
CORE_DB_HOST=postgres CORE_DB_DATABASE=ark_testnet CORE_DB_USERNAME=ark ARK_LOG_FILE=ark.log CORE_PATH_CONFIG=./packages/core/bin/config/testnet CORE_PATH_DATA=./packages/core/bin/config/testnet ./packages/core/bin/run core:run >> output.log 2> errors.log &
echo kill -2 $! > killpid.sh
pwd >> output.log
cat killpid.sh >> output.log
echo "Started ark" >> output.log