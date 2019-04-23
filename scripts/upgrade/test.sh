#!/usr/bin/env bash

rm -rf /home/ark/ark-core
git clone https://github.com/ARKEcosystem/core -b upgrade /home/ark/ark-core

mkdir /home/ark/.ark
touch /home/ark/.ark/.env

mkdir /home/ark/.ark/config

mkdir /home/ark/.ark/database
touch /home/ark/.ark/database/json-rpc.sqlite
touch /home/ark/.ark/database/transaction-pool.sqlite
touch /home/ark/.ark/database/webhooks.sqlite

mkdir /home/ark/.ark/logs
mkdir /home/ark/.ark/logs/mainnet
touch /home/ark/.ark/logs/mainnet/test.log
