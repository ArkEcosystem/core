#!/usr/bin/env bash

for dir in `find packages -mindepth 1 -maxdepth 1 -type d | sort -nr`; do
    git checkout develop
    cd $dir
    echo $PWD
    npm publish --tag rc
    cd ../..
done
