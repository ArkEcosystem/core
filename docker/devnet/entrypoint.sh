#!/usr/bin/env bash

sysctl -w net.ipv4.conf.all.route_localnet=1

POSTGRES=$(ping -c 1 ark-postgres | awk -F'[()]' '/PING/{print $2}')
REDIS=$(ping -c 1 ark-redis | awk -F'[()]' '/PING/{print $2}')
CORE=$(ping -c 1 ark-core | awk -F'[()]' '/PING/{print $2}')

iptables -I OUTPUT -t nat -o lo -d localhost -p tcp --dport 5432 -j DNAT --to-destination ${POSTGRES}:5432
iptables -I POSTROUTING -t nat -p tcp --dport 5432 -d ${POSTGRES} -j SNAT --to ${CORE}
iptables -I OUTPUT -t nat -o lo -d localhost -p tcp --dport 6379 -j DNAT --to-destination ${REDIS}:6379
iptables -I POSTROUTING -t nat -p tcp --dport 6379 -d ${REDIS} -j SNAT --to ${CORE}

cd /ark-core
rm -rf node_modules package-lock.json > /dev/null 2>&1
npm --quiet install pg && npm --quiet install pg-hstore && npm --quiet install 

bash
