#!/usr/bin/env bash
sudo /usr/sbin/ntpd -s

sudo rm -rf /home/node/.config/ark-core/*
sudo rm -rf /home/node/.local/state/ark-core/*
sudo chown node:node -R /home/node
~/.yarn/bin/ark config:publish --network=$NETWORK
sudo rm -f /home/node/.config/ark-core/$NETWORK/.env

CONFIG=/home/node/.config/ark-core/$NETWORK
SECRET=`openssl rsautl -decrypt -inkey /run/secrets/secret.key -in /run/secrets/secret.dat`
CORE_FORGER_PASSWORD=`openssl rsautl -decrypt -inkey /run/secrets/bip.key -in /run/secrets/bip.dat`

#startup functions

start_relay ()
{
    ~/.yarn/bin/ark relay:start
}

config_bip38 ()
{
    ~/.yarn/bin/ark config:forger:bip38 --bip38 "$SECRET" --password "$CORE_FORGER_PASSWORD"
}

config_bip39 ()
{
    ~/.yarn/bin/ark config:forger:bip39 --bip39 "$SECRET"
}

start_forger_with_bip38 ()
{
    ~/.yarn/bin/ark forger:start --bip38 "$SECRET" --password "$CORE_FORGER_PASSWORD"
}

start_forger_with_bip39 ()
{
    ~/.yarn/bin/ark forger:start --bip39 "$SECRET"
}

#configure
if [ -n "$SECRET" ] && [ -n "$CORE_FORGER_PASSWORD" ]; then
        config_bip38
elif [ "$MODE" = "forger" ] && [ -z "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
        echo "set SECRET and/or CORE_FORGER_PASWORD if you want to run a forger"
        exit
elif [ -n "$CORE_FORGER_PASSWORD" ]; then
        config_bip39
fi

#relay
if [[ "$MODE" = "relay" ]]; then
        start_relay
fi

#forging
if [ "$MODE" = "forger" ] && [ -n "$SECRET" ] && [ -n "$CORE_FORGER_PASSWORD" ]; then
        export CORE_FORGER_BIP38=$(grep bip38 /home/node/.config/ark-core/$NETWORK/delegates.json | awk '{print $2}' | tr -d '"') && export CORE_FORGER_PASSWORD && start_forger_with_bip38 && sudo rm -rf /run/secrets/*
elif [ "$MODE" = "forger" ] && [ -z "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
        echo "set SECRET and/or CORE_FORGER_PASWORD if you want to run a forger"
        exit
elif [ "$MODE" = "forger" ] && [ -n "$SECRET" ] && [ -z "$CORE_FORGER_PASSWORD" ]; then
        start_forger_with_bip39
fi
