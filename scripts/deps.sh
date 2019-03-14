#!/usr/bin/env bash

for dir in `find packages -mindepth 1 -maxdepth 1 -type d`; do
    cd $dir
    echo $PWD
    cd ../..
    ./node_modules/npm-check-updates/bin/npm-check-updates -u
done
