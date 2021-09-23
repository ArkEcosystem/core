#!/bin/sh

SDK_VERSION=$(cat package.json | sed -n -e '/version/ s/.*: *"\([^"]*\).*/\1/p')
echo "Building JavaScript SDK v$SDK_VERSION...\n"
browserify -s socketCluster index.js > socketcluster.js && uglifyjs socketcluster.js -o socketcluster.min.js