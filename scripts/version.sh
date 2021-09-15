#!/usr/bin/env bash

./node_modules/lerna/cli.js version $1 --exact --no-git-tag-version --yes
