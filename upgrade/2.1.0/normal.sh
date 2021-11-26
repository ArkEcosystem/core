#!/usr/bin/env bash

cd ~/ark-core
pm2 delete all
git reset --hard
git pull
git checkout master
pnpm run setup
pnpm run upgrade

# If you do not use Core Commander you can skip this step.
cd ~/core-commander
git reset --hard
git pull
git checkout master
bash commander.sh
