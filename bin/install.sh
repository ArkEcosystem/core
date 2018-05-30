#!/usr/bin/env bash

# ark_commander=$(basename "$0")
DIR=$(cd $(dirname "$0") && pwd)
. "${DIR}/lib/colors.sh"
. "${DIR}/lib/dependencies.sh"

check_program_dependencies
check_nodejs_dependencies
install_base_dependencies
