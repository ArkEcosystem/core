#!/usr/bin/env bash

echo "Running pre-commit script..."

node .circleci/generateConfig.js
git add .circleci/config.yml

echo "pre-commit script was run succesfully"
