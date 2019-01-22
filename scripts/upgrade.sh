#!/usr/bin/env bash

pm2 stop ark-core
pm2 stop ark-core-relay
pm2 stop ark-core-forger

pm2 stop core
pm2 stop core-relay
pm2 stop core-forger

node ./scripts/upgrade/upgrade.js
