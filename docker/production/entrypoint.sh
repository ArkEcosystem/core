#!/usr/bin/env bash
sudo /usr/sbin/ntpd -s

sudo rm -rf /home/node/.config/ark-core/*
sudo rm -rf /home/node/.local/state/ark-core/*
sudo chown node:node -R /home/node
ark config:publish --network=$NETWORK --force
sudo rm -f /home/node/.config/ark-core/$NETWORK/.env

SECRET=`openssl rsautl -decrypt -inkey /run/secrets/secret.key -in /run/secrets/secret.dat`
CORE_FORGER_PASSWORD=`openssl rsautl -decrypt -inkey /run/secrets/bip.key -in /run/secrets/bip.dat`

# configure
if [ -n "$SECRET" ] && [ -n "$CORE_FORGER_PASSWORD" ]; then
    ark config:forger:bip38 --bip39 "$SECRET" --password "$CORE_FORGER_PASSWORD"
elif [ "$MODE" = "forger" ] && [ -z "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
    echo "set SECRET and/or CORE_FORGER_PASWORD if you want to run a forger"
    exit
elif [ -n "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
    ark config:forger:bip39 --bip39 "$SECRET"
fi

# relay
if [[ "$MODE" = "relay" ]]; then
    ark relay:start --no-daemon
fi

# forging
if [ "$MODE" = "forger" ] && [ -n "$SECRET" ] && [ -n "$CORE_FORGER_PASSWORD" ]; then
    export CORE_FORGER_BIP38=$(grep bip38 /home/node/.config/ark-core/$NETWORK/delegates.json | awk '{print $2}' | tr -d '"')
    export CORE_FORGER_PASSWORD
    sudo rm -rf /run/secrets/*
    ark core:start --no-daemon
elif [ "$MODE" = "forger" ] && [ -z "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
    echo "set SECRET and/or CORE_FORGER_PASWORD if you want to run a forger"
    exit
elif [ "$MODE" = "forger" ] && [ -n "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
    ark core:start --no-daemon
fi

