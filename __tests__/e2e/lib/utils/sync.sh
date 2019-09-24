# FULL SYNC SCRIPT
# This script allows to run a mainnet sync on a fresh server.
# It uses e2e framework to generate and launch 3 relay nodes, 1 with empty db and 2 with db from latest snapshot.
# The one with empty db (node2) should sync from the others (node0, node1).
# To use with devnet just replace mainnet by devnet and download devnet snapshot instead of mainnet.

# install nvm and use node 10
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
source ~/.bashrc && nvm install 10 && nvm use 10

# install yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn

# install needed packages
sudo apt-get install docker.io python build-essential
sudo curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# initialize docker swarm
hostname -I | awk '{print $1}' | xargs -I {} docker swarm init --advertise-addr {}

# checkout core develop branch and build app
git clone https://github.com/ArkEcosystem/core.git && cd core && git checkout develop
yarn && yarn bootstrap && yarn build && cd __tests__/e2e && yarn install

# generate files for 3 nodes (relays) network based on mainnet config
yarn generate -c 3 -v 10 -n mainnet -r

# make some files executable
sudo chmod +x dist/docker*
sudo chmod +x dist/node0/docker/testnet-e2e/entrypoint.sh
sudo chmod +x dist/node1/docker/testnet-e2e/entrypoint.sh
sudo chmod +x dist/node2/docker/testnet-e2e/entrypoint.sh
sudo chmod +x dist/node0/ark.sh
sudo chmod +x dist/node1/ark.sh
sudo chmod +x dist/node2/ark.sh

# launch docker containers for the 3 nodes (each node has 1 container for core and 1 for postgres)
cd dist && ./docker-init.sh && ./docker-start.sh && cd ..

# download and restore last mainnet snapshot into nodes 0 and 1 : node2 will be the one syncing from zero
wget http://snapshots.ark.io/current-v2
docker ps --format \"{{.Names}}\" | grep node[0-1]_postgres | xargs -I {} sh -c 'docker cp current-v2 {}:current-v2'
docker ps --format \"{{.Names}}\" | grep node[0-1]_postgres | xargs -I {} sh -c 'docker exec -i {} pg_restore -U ark -O -j 8 -d ark_testnet current-v2'

# run sync
sudo chown -R $USER:$USER ./dist/ && yarn run-sync -n mainnet -t 1200

# This last command will exist with error exit code if time limit was reached before sync.
# Logs will be available in dist/node2/output.log and dist/node2/errors.log (same for node0 and node1)
