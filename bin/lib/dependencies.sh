#!/usr/bin/env bash

DEPENDENCIES_PROGRAMS=('postgresql postgresql-contrib build-essential libcairo2-dev pkg-config libtool autoconf automake python git curl libpq-dev redis-server')
DEPENDENCIES_NODEJS=('pm2 lerna')

check_program_dependencies()
{
    heading_transparent "Installing Program Dependencies..."

    TO_INSTALL=""
    for dependency in ${DEPENDENCIES_PROGRAMS[@]}; do
        INSTALLED=$(dpkg -l "$dependency" 2>/dev/null | fgrep "$dependency" | egrep "^[a-zA-Z]" | awk '{print $2}') || true
        if [[ "$INSTALLED" != "$dependency" ]]; then
            TO_INSTALL="$TO_INSTALL$dependency "
        fi
    done

    if [[ ! -z "$TO_INSTALL" ]]; then
        echo "Dependencies [ ${TO_INSTALL}] are not installed. Installing..."
        success "Installing Program Dependencies..."
        sudo sh -c "sudo apt-get install ${TO_INSTALL} -y"
        success 'Program Dependencies Installed!'
    fi

    heading_transparent "Installing Program Dependencies..."
}

check_nodejs_dependencies()
{
    heading_transparent "Installing NodeJS Dependencies..."

    TO_INSTALL=""
    for dependency in ${DEPENDENCIES_NODEJS[@]}; do
        INSTALLED=$(npm list -g "$dependency" | fgrep "$dependency" | awk '{print $2}' | awk -F'@' '{print $1}') || true
        if [[ "$INSTALLED" != "$dependency" ]]; then
            TO_INSTALL="$TO_INSTALL$dependency "
        fi
    done

    if [[ ! -z "$TO_INSTALL" ]]; then
        echo "[ ${TO_INSTALL}] are not installed. Installing"
        success "Installing NodeJS Dependencies..."
        sh -c "npm install -g ${TO_INSTALL}"
        success 'NodeJS Dependencies Installed!'
    fi

    heading_transparent "Installing NodeJS Dependencies..."
}

install_base_dependencies ()
{
    ## Update and Install Initial Packages
    heading_transparent "Installing System Dependencies..."
    sudo apt-get update && sudo apt-get install -y git curl
    heading_transparent "Installed System Dependencies..."

    ## Install NodeJS & NPM
    heading_transparent "Installing NodeJS & NPM..."
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
    . "$HOME/.nvm/nvm.sh"
    nvm install 9.3.0
    heading_transparent "Installed NodeJS & NPM..."

    ## Install Yarn
    heading_transparent "Installing Yarn..."
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    sudo apt-get update && sudo apt-get install -y yarn
    heading_transparent "Installed Yarn..."
}