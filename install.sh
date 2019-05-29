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
DEB=$(which apt-get)
RPM=$(which yum)

# Detect SystemV / SystemD
SYS=$([[ -L "/sbin/init" ]] && echo 'SystemD' || echo 'SystemV')

if [[ ! -z $DEB ]]; then
    success "Running install for Debian derivate"
elif [[ ! -z $RPM ]]; then
    success "Running install for RedHat derivate"
else
    heading "Not supported system"
    exit 1;
fi

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
    if [[ ! -z $DEB ]]; then
        sudo locale-gen en_US.UTF-8
        sudo update-locale LANG=en_US.UTF-8
    elif [[ ! -z $RPM ]]; then
        sudo localedef -c -i en_US -f UTF-8 en_US.UTF-8
    fi

    # Setting the current shell locale
    export LC_ALL="en_US.UTF-8"
    export LANG="en_US.UTF-8"
    export LANGUAGE="en_US.UTF-8"

    # Setting the bashrc locale
    echo "export LC_ALL=en_US.UTF-8" >> "$HOME/.bashrc"
    echo "export LANG=en_US.UTF-8" >> "$HOME/.bashrc"
    echo "export LANGUAGE=en_US.UTF-8" >> "$HOME/.bashrc"
fi

heading "Installing system dependencies..."

if [[ ! -z $DEB ]]; then
    sudo apt-get update
    sudo apt-get install -y git curl apt-transport-https update-notifier
elif [[ ! -z $RPM ]]; then
    sudo yum update -y
    sudo yum install git curl epel-release -y
fi

success "Installed system dependencies!"

heading "Installing node.js & npm..."

sudo rm -rf /usr/local/{lib/node{,/.npm,_modules},bin,share/man}/{npm*,node*,man1/node*}
sudo rm -rf ~/{.npm,.forever,.node*,.cache,.nvm}

if [[ ! -z $DEB ]]; then
    sudo wget --quiet -O - https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -
    (echo "deb https://deb.nodesource.com/node_11.x $(lsb_release -s -c) main" | sudo tee /etc/apt/sources.list.d/nodesource.list)
    sudo apt-get update
    sudo apt-get install nodejs -y
elif [[ ! -z $RPM ]]; then
    sudo yum install gcc-c++ make -y
    curl -sL https://rpm.nodesource.com/setup_11.x | sudo -E bash - > /dev/null 2>&1
fi

success "Installed node.js & npm!"

heading "Installing Yarn..."

if [[ ! -z $DEB ]]; then
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    (echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list)

    sudo apt-get update
    sudo apt-get install -y yarn
elif [[ ! -z $RPM ]]; then
    curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
    sudo yum install yarn -y
fi

success "Installed Yarn!"

heading "Installing PM2..."

sudo yarn global add pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 500M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 7

success "Installed PM2!"

heading "Installing program dependencies..."

if [[ ! -z $DEB ]]; then
    sudo apt-get install build-essential libcairo2-dev pkg-config libtool autoconf automake python libpq-dev jq -y
elif [[ ! -z $RPM ]]; then
    sudo yum groupinstall "Development Tools" -y -q
    sudo yum install postgresql-devel jq -y -q
fi

success "Installed program dependencies!"

heading "Installing PostgreSQL..."

if [[ ! -z $DEB ]]; then
    sudo apt-get update
    sudo apt-get install postgresql postgresql-contrib -y
elif [[ ! -z $RPM ]]; then
    sudo yum install postgresql-server postgresql-contrib -y

    if [[ "$SYS" == "SystemV" ]]; then
        sudo service postgresql initdb
        sudo service postgresql start
    else
        sudo postgresql-setup initdb
        sudo systemctl start postgresql
    fi
fi

success "Installed PostgreSQL!"

heading "Installing NTP..."

sudo timedatectl set-ntp off > /dev/null 2>&1 # disable the default systemd timesyncd service

if [[ ! -z $DEB ]]; then
    sudo apt-get install ntp -yyq
elif [[ ! -z $RPM ]]; then
    sudo yum install ntp -y -q
fi

sudo ntpd -gq

success "Installed NTP!"

heading "Installing system updates..."

if [[ ! -z $DEB ]]; then
    sudo apt-get update
    sudo apt-get upgrade -yqq
    sudo apt-get dist-upgrade -yq
    sudo apt-get autoremove -yyq
    sudo apt-get autoclean -yq
elif [[ ! -z $RPM ]]; then
    sudo yum update
    sudo yum clean
fi

success "Installed system updates!"

heading "Installing ARK Core..."

yarn global add @arkecosystem/core
echo 'export PATH=$(yarn global bin):$PATH' >> ~/.bashrc
export PATH=$(yarn global bin):$PATH
ark config:publish

success "Installed ARK Core!"

# setup postgres username, password and database
read -p "Would you like to configure the database? [y/N]: " choice

if [[ "$choice" =~ ^(yes|y|Y) ]]; then
    read -p "Enter the database username: " databaseUsername
    read -p "Enter the database password: " databasePassword
    read -p "Enter the database name: " databaseName

    ark env:set CORE_DB_USERNAME $databaseUsername
    ark env:set CORE_DB_PASSWORD $databasePassword
    ark env:set CORE_DB_DATABASE $databaseName

    userExists=$(sudo -i -u postgres psql -c "SELECT * FROM pg_user WHERE usename = '${databaseUsername}'" | grep -c "1 row")
    databaseExists=$(sudo -i -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${databaseName}'")

    if [[ $userExists == 1 ]]; then
        read -p "The database user ${databaseUsername} already exists, do you want to overwrite it? [y/N]: " choice

        if [[ "$choice" =~ ^(yes|y|Y) ]]; then
            if [[ $databaseExists == 1 ]]; then
                sudo -i -u postgres psql -c "ALTER DATABASE ${databaseName} OWNER TO postgres;"
            fi
            sudo -i -u postgres psql -c "DROP USER ${databaseUsername}"
            sudo -i -u postgres psql -c "CREATE USER ${databaseUsername} WITH PASSWORD '${databasePassword}' CREATEDB;"
        elif [[ "$choice" =~ ^(no|n|N) ]]; then
            continue;
        fi
    else
        sudo -i -u postgres psql -c "CREATE USER ${databaseUsername} WITH PASSWORD '${databasePassword}' CREATEDB;"
    fi

    if [[ $databaseExists == 1 ]]; then
        read -p "The database ${databaseName} already exists, do you want to overwrite it? [y/N]: " choice

        if [[ "$choice" =~ ^(yes|y|Y) ]]; then
            sudo -i -u postgres psql -c "DROP DATABASE ${databaseName};"
            sudo -i -u postgres psql -c "CREATE DATABASE ${databaseName} WITH OWNER ${databaseUsername};"
        elif [[ "$choice" =~ ^(no|n|N) ]]; then
            sudo -i -u postgres psql -c "ALTER DATABASE ${databaseName} OWNER TO ${databaseUsername};"
        fi
    else
        sudo -i -u postgres psql -c "CREATE DATABASE ${databaseName} WITH OWNER ${databaseUsername};"
    fi
fi

exec "$BASH"
