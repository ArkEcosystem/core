#! /bin/bash

. "$(brew --prefix nvm)/nvm.sh"

NODE_VERSIONS=(0.12 4 6 8 9)

for version in ${NODE_VERSIONS[@]}; do
  echo " -- Node $version"
  nvm install $version && \
    npm install --no-download && \
    npm test && \
    rm -rf node_modules || \
    exit $?
done
