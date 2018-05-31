#!/usr/bin/env bash

DIR=$(cd $(dirname "$0") && pwd)
. "${DIR}/lib/dependencies.sh"

check_program_dependencies
check_nodejs_dependencies
install_base_dependencies
