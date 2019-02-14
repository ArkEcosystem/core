#!/usr/bin/env bash

cd ~/ark-core
pm2 delete ark-core
pm2 delete ark-core-relay
git reset --hard
git pull
git checkout master
yarn run bootstrap
yarn run upgrade

pm2 --name 'ark-core-relay' start ~/ark-core/packages/core/dist/index.js -- relay --network mainnet
