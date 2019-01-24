#!/usr/bin/env bash

# -----------------------------------
# SET SYSTEM LOCALE
# -----------------------------------

if [[ $(locale -a | grep ^en_US.UTF-8) ]] || [[ $(locale -a | grep ^en_US.utf8) ]]; then
    if ! $(grep -E "(en_US.UTF-8)" "$HOME/.bashrc"); then
        # Setting the bashrc locale
        echo "export LC_ALL=en_US.UTF-8" >> "$HOME/.bashrc"
        echo "export LANG=en_US.UTF-8" >> "$HOME/.bashrc"
        echo "export LANGUAGE=en_US.UTF-8" >> "$HOME/.bashrc"

        # Setting the current shell locale
        export LC_ALL="en_US.UTF-8"
        export LANG="en_US.UTF-8"
        export LANGUAGE="en_US.UTF-8"
    fi
else
    # Install en_US.UTF-8 Locale
    sudo locale-gen en_US.UTF-8
    sudo update-locale LANG=en_US.UTF-8

    # Setting the current shell locale
    export LC_ALL="en_US.UTF-8"
    export LANG="en_US.UTF-8"
    export LANGUAGE="en_US.UTF-8"

    # Setting the bashrc locale
    echo "export LC_ALL=en_US.UTF-8" >> "$HOME/.bashrc"
    echo "export LANG=en_US.UTF-8" >> "$HOME/.bashrc"
    echo "export LANGUAGE=en_US.UTF-8" >> "$HOME/.bashrc"
fi

# -----------------------------------
# SYSTEM DEPENDENCIES
# -----------------------------------

heading "Installing system dependencies..."

sudo apt-get update
sudo apt-get install -y git curl apt-transport-https update-notifier

success "Installed system dependencies!"

# -----------------------------------
# INSTALL NODE.JS/NPM
# -----------------------------------

heading "Installing node.js & npm..."

sudo rm -rf /usr/local/{lib/node{,/.npm,_modules},bin,share/man}/{npm*,node*,man1/node*}
sudo rm -rf ~/{.npm,.forever,.node*,.cache,.nvm}

sudo wget --quiet -O - https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -
(echo "deb https://deb.nodesource.com/node_10.x $(lsb_release -s -c) main" | sudo tee /etc/apt/sources.list.d/nodesource.list)
sudo apt-get update
sudo apt-get install nodejs -y

success "Installed node.js & npm!"

# -----------------------------------
# INSTALL YARN
# -----------------------------------

heading "Installing Yarn..."

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
(echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list)

sudo apt-get update
sudo apt-get install -y yarn

success "Installed Yarn!"

# -----------------------------------
# PROGRAM DEPENDENCIES
# -----------------------------------

heading "Installing program dependencies..."

sudo apt-get install build-essential libcairo2-dev pkg-config libtool autoconf automake python git curl libpq-dev jq -y

success "Installed program dependencies!"

# -----------------------------------
# INSTALL POSTGRESQL
# -----------------------------------

heading "Installing PostgreSQL..."

sudo apt-get update
sudo apt-get install postgresql postgresql-contrib -y

success "Installed PostgreSQL!"

# -----------------------------------
# INSTALL NTPD
# -----------------------------------

heading "Installing NTP..."

sudo timedatectl set-ntp off # disable the default systemd timesyncd service
sudo apt-get install ntp -yyq
sudo ntpd -gq

success "Installed NTP!"

# -----------------------------------
# NODE.JS DEPENDENCIES
# -----------------------------------

heading "Installing node.js dependencies..."

yarn global add pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 500M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 7

success "Installed node.js dependencies!"

# -----------------------------------
# SYSTEM UPDATES
# -----------------------------------

heading "Installing system updates..."

sudo apt-get update
sudo apt-get upgrade -yqq
sudo apt-get dist-upgrade -yq
sudo apt-get autoremove -yyq
sudo apt-get autoclean -yq

success "Installed system updates!"

# -----------------------------------
# TODO: SETUP POSTGRES USER/PASS/DB
# -----------------------------------

# -----------------------------------
# TODO: INSTALL @ARKECOSYSTEM/CORE
# -----------------------------------
