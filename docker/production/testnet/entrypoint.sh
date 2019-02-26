#!/usr/bin/env bash
sudo /usr/sbin/ntpd -s

sudo rm -rf /home/node/.config/ark-core/*
sudo rm -rf /home/node/.local/state/ark-core/*
sudo chown node:node -R /home/node
cp -r /home/node/core/packages/core/src/config/$NETWORK /home/node/.config/ark-core/$NETWORK
cd /home/node/core/packages/core
chmod +x ./dist/index.js

CONFIG=/home/node/.config/ark-core/$NETWORK
SECRET=`openssl rsautl -decrypt -inkey /run/secrets/secret.key -in /run/secrets/secret.dat`
CORE_FORGER_PASSWORD=`openssl rsautl -decrypt -inkey /run/secrets/bip.key -in /run/secrets/bip.dat`

#startup functions

config_plain ()
{
        ./dist/index.js forger-plain --config $CONFIG --secret "$SECRET"
}

config_bip ()
{
        ./dist/index.js forger-bip38 --config $CONFIG --network $NETWORK --secret "$SECRET" --password "$CORE_FORGER_PASSWORD"
}

start_relay ()
{
        pm2 --name 'ark-core' --no-daemon start ./dist/index.js -- relay --config $CONFIG --network $NETWORK
}

start_forger ()
{
        pm2 --name 'ark-core' --no-daemon start ./dist/index.js -- start --config $CONFIG --network $NETWORK
}

start_bip ()
{
        pm2 --name 'ark-core' --no-daemon start ./dist/index.js -- start --config $CONFIG --network $NETWORK 
}

#configure
if [ -n "$SECRET" ] && [ -n "$CORE_FORGER_PASSWORD" ]; then
        config_bip
elif [ "$MODE" = "forger" ] && [ -z "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
        echo "set SECRET and/or CORE_FORGER_PASWORD if you want to run a forger"
        exit
elif [ -n "$CORE_FORGER_PASSWORD" ]; then
        config_plain
fi

#relay
if [[ "$MODE" = "relay" ]]; then
        start_relay
fi

#forging
if [ "$MODE" = "forger" ] && [ -n "$SECRET" ] && [ -n "$CORE_FORGER_PASSWORD" ]; then
        export CORE_FORGER_BIP38=$(grep bip38 /home/node/.config/ark-core/$NETWORK/delegates.json | awk '{print $2}' | tr -d '"') && export CORE_FORGER_PASSWORD && start_bip && sudo rm -rf /run/secrets/*
elif [ "$MODE" = "forger" ] && [ -z "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
        echo "set SECRET and/or CORE_FORGER_PASWORD if you want to run a forger"
        exit
elif [ "$MODE" = "forger" ] && [ -n "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
        start_forger 
fi

