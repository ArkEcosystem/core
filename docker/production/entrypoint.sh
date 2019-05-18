#!/usr/bin/env bash
sudo /usr/sbin/ntpd -s

sudo rm -rf /home/node/.config/ark-core/*
sudo rm -rf /home/node/.local/state/ark-core/*
sudo chown node:node -R /home/node
yarn --cwd /home/node/core ark config:publish --network=$NETWORK
sudo rm -f /home/node/.config/ark-core/$NETWORK/.env

if [ "$MODE" = "forger" ]; then
    echo "{\"secrets\":[\"$DELEGATE_PASSPHRASE\"]}" > /home/node/.config/ark-core/$NETWORK/delegates.json
    yarn --cwd /home/node/core ark core:start --no-daemon
fi

# relay
if [[ "$MODE" = "relay" ]]; then
    yarn --cwd /home/node/core ark relay:start --no-daemon
fi
