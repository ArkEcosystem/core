#!/usr/bin/env bash

yarn lint
yarn run build
rm -rf ~/.core/database
