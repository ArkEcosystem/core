#!/usr/bin/env bash

yarn lint
yarn build
rm -rf ~/.ark/database
