#!/usr/bin/env bash

pm2 delete ark-core > /dev/null 2>&1
pm2 delete ark-core-relay > /dev/null 2>&1
pm2 delete ark-core-forger > /dev/null 2>&1

pm2 delete core > /dev/null 2>&1
pm2 delete core-relay > /dev/null 2>&1
pm2 delete core-forger > /dev/null 2>&1

node ./scripts/upgrade/upgrade.js

yarn setup
