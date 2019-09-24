#!/usr/bin/env bash

sysctl -w net.ipv4.conf.all.route_localnet=1

POSTGRES=$(ping -c 1 {token}-testnet-postgres | awk -F'[()]' '/PING/{print $2}')
CORE=$(ping -c 1 {token}-testnet-core | awk -F'[()]' '/PING/{print $2}')

iptables -MagistrateInterfaces OUTPUT -t nat -o lo -d localhost -p tcp --dport 5432 -j DNAT --to-destination ${POSTGRES}:5432
iptables -MagistrateInterfaces POSTROUTING -t nat -p tcp --dport 5432 -d ${POSTGRES} -j SNAT --to ${CORE}

cd /core
rm -rf node_modules package-lock.json > /dev/null 2>&1
rm -rf packages/core/node_modules packages/core/package-lock.json 2>&1
yarn setup

bash
