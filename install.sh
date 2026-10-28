#!/usr/bin/env bash

set -e

# Typography
red=$(tput setaf 1)
green=$(tput setaf 2)
yellow=$(tput setaf 3)
lila=$(tput setaf 4)
pink=$(tput setaf 5)
blue=$(tput setaf 6)
white=$(tput setaf 7)
black=$(tput setaf 8)

bold=$(tput bold)
reset=$(tput sgr0)

heading ()
{
    echo "    ${lila}==>${reset}${bold} $1${reset}"
}

success ()
{
    echo "    ${green}==>${reset}${bold} $1${reset}"
}

info ()
{
    echo "    ${blue}==>${reset}${bold} $1${reset}"
}

warning ()
{
    echo "    ${yellow}==>${reset}${bold} $1${reset}"
}

error ()
{
    echo "    ${red}==>${reset}${bold} $1${reset}"
}

# Detect pkg type
DEB=$(which apt-get || :)

# Detect Debian/Ubuntu derivative
DEB_ID=$( (grep DISTRIB_CODENAME /etc/upstream-release/lsb-release || grep DISTRIB_CODENAME /etc/lsb-release || grep VERSION_CODENAME /etc/os-release) 2>/dev/null | cut -d'=' -f2 )

#APT Vars
APT_ENV="DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a"


if [[ ! -z $DEB ]]; then
    success "Running install for Debian derivative"
else
    heading "Unsupported system"
    exit 1;
fi

heading "Installing system dependencies..."

sudo apt-get update
sudo $APT_ENV apt-get install git curl apt-transport-https bc wget gnupg locales -yq

success "Installed system dependencies!"

heading "Configuring the en_US.UTF-8 locale..."

if ! locale -a | grep -qiE '^en_US\.utf-?8$'; then
    # Debian only generates the locales that are enabled in /etc/locale.gen
    sudo sed -i 's/^# *\(en_US.UTF-8 UTF-8\)/\1/' /etc/locale.gen 2>/dev/null || true
    sudo locale-gen en_US.UTF-8
    sudo update-locale LANG=en_US.UTF-8
fi

export LC_ALL="en_US.UTF-8"
export LANG="en_US.UTF-8"
export LANGUAGE="en_US.UTF-8"

if ! grep -q "en_US.UTF-8" "$HOME/.bashrc"; then
    echo "export LC_ALL=en_US.UTF-8" >> "$HOME/.bashrc"
    echo "export LANG=en_US.UTF-8" >> "$HOME/.bashrc"
    echo "export LANGUAGE=en_US.UTF-8" >> "$HOME/.bashrc"
fi

success "Configured the en_US.UTF-8 locale!"

heading "Make sure NTP exists systemwide and it's enabled by default..."

sudo $APT_ENV apt-get install systemd-timesyncd -yq
sudo timedatectl set-ntp on > /dev/null 2>&1 || true

success "Done setting up NTP!"

heading "Installing node.js & npm..."

sudo rm -rf /usr/local/{lib/node{,/.npm,_modules},bin,share/man}/{npm*,node*,man1/node*}
sudo rm -rf ~/{.npm,.forever,.node*,.cache,.nvm}
(echo -e "Package: nodejs\nPin: origin deb.nodesource.com\nPin-Priority: 999" | sudo tee /etc/apt/preferences.d/nodesource)
curl -sL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor | sudo tee /usr/share/keyrings/nodesource.gpg >/dev/null
(echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list)
sudo apt-get update
sudo $APT_ENV apt-get install nodejs -yq

success "Installed node.js & npm!"

heading "Installing yarn..."

curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null
(echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list)
sudo apt-get update
sudo $APT_ENV apt-get install yarn -yq

success "Installed yarn!"

heading "Installing pm2..."

sudo yarn global add pm2@7
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 500M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 7

success "Installed pm2!"

heading "Installing PostgreSQL..."

curl -sL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | sudo tee /usr/share/keyrings/pgdg.gpg >/dev/null
(echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] https://apt.postgresql.org/pub/repos/apt ${DEB_ID}-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list)
sudo apt-get update
sudo $APT_ENV apt-get install postgresql-18 -yq

success "Installed PostgreSQL!"

heading "Installing program dependencies..."

sudo $APT_ENV apt-get install build-essential python-is-python3 pkg-config libtool autoconf automake libpq-dev jq libjemalloc-dev python3-setuptools -yq

success "Installed program dependencies!"

heading "Installing system updates..."

sudo apt-get update
sudo $APT_ENV apt-get upgrade -yq
sudo $APT_ENV apt-get dist-upgrade -yq
sudo apt-get autoremove -yq
sudo apt-get autoclean -yq

success "Installed system updates!"

heading "Installing ARK Core..."

while ! yarn global add @arkecosystem/core ; do
    read -p "Installing ARK Core failed, do you want to retry? [y/N]: " choice
    if [[ ! "$choice" =~ ^(yes|y|Y) ]] ; then
        exit 1
    fi
done

echo 'export PATH=$(yarn global bin):$PATH' >> ~/.bashrc
export PATH=$(yarn global bin):$PATH
ark config:publish

success "Installed ARK Core!"

readNonempty() {
    prompt=${1}
    answer=""
    while [ -z "${answer}" ] ; do
        read -p "${prompt}" answer
    done
    echo "${answer}"
}

# setup postgres username, password and database
read -p "Would you like to configure the database? [y/N]: " choice

if [[ "$choice" =~ ^(yes|y|Y) ]]; then
    choice=""
    while [[ ! "$choice" =~ ^(yes|y|Y) ]] ; do
        databaseUsername=$(readNonempty "Enter the database username: ")
        databasePassword=$(readNonempty "Enter the database password: ")
        databaseName=$(readNonempty "Enter the database name: ")

        echo "database username: ${databaseUsername}"
        echo "database password: ${databasePassword}"
        echo "database name: ${databaseName}"
        read -p "Proceed? [y/N]: " choice
    done

    ark env:set --key=CORE_DB_USERNAME --value="${databaseUsername}"
    ark env:set --key=CORE_DB_PASSWORD --value="${databasePassword}"
    ark env:set --key=CORE_DB_DATABASE --value="${databaseName}"

    userExists=$(sudo -i -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename = '${databaseUsername}'")
    databaseExists=$(sudo -i -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${databaseName}'")

    if [[ $userExists == 1 ]]; then
        read -p "The database user ${databaseUsername} already exists, do you want to recreate it? [y/N]: " choice

        if [[ "$choice" =~ ^(yes|y|Y) ]]; then
            if [[ $databaseExists == 1 ]]; then
                sudo -i -u postgres psql -c "ALTER DATABASE ${databaseName} OWNER TO postgres;"
            fi
            sudo -i -u postgres psql -c "DROP USER ${databaseUsername}"
            sudo -i -u postgres psql -c "CREATE USER ${databaseUsername} WITH PASSWORD '${databasePassword}' CREATEDB;"
        fi
    else
        sudo -i -u postgres psql -c "CREATE USER ${databaseUsername} WITH PASSWORD '${databasePassword}' CREATEDB;"
    fi

    if [[ $databaseExists == 1 ]]; then
        read -p "The database ${databaseName} already exists, do you want to overwrite it? [y/N]: " choice

        if [[ "$choice" =~ ^(yes|y|Y) ]]; then
            sudo -i -u postgres psql -c "DROP DATABASE ${databaseName};"
            sudo -i -u postgres psql -c "CREATE DATABASE ${databaseName} WITH OWNER ${databaseUsername};"
        else
            sudo -i -u postgres psql -c "ALTER DATABASE ${databaseName} OWNER TO ${databaseUsername};"
        fi
    else
        sudo -i -u postgres psql -c "CREATE DATABASE ${databaseName} WITH OWNER ${databaseUsername};"
    fi
fi

exec "$BASH"
