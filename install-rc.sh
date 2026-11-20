#!/usr/bin/env bash
# ARK Core RC installer for Debian and Ubuntu.
# Review before running. Run as a user with sudo access.
set -Eeuo pipefail
IFS=$'\n\t'

readonly NODE_MAJOR=24
readonly PG_MAJOR=18
readonly CORE_PACKAGE='@arkecosystem/core@rc'
readonly NODE_KEYRING='/usr/share/keyrings/nodesource.gpg'
readonly PG_KEYRING='/usr/share/keyrings/postgresql.gpg'
readonly YARN_KEYRING='/usr/share/keyrings/yarnkey.gpg'

if [[ ! -t 0 || ! -t 1 ]]; then
  printf 'Run this installer in an interactive terminal.\n' >&2
  exit 2
fi
. /etc/os-release
case "${ID:-}" in
  ubuntu|debian) ;;
  *) printf "Unsupported distribution '%s'. Supported: Debian and Ubuntu.\n" "${ID:-unknown}" >&2; exit 2 ;;
esac
for cmd in apt-get dpkg awk grep; do
  command -v "$cmd" >/dev/null || { printf 'Required command not found: %s\n' "$cmd" >&2; exit 2; }
done

if ! command -v sudo >/dev/null 2>&1; then
  if (( EUID == 0 )); then
    printf 'sudo is missing. As root, run: apt-get update && apt-get install -y sudo\nThen rerun this installer.\n' >&2
  else
    printf 'sudo is missing. Ask root to run: apt-get update && apt-get install -y sudo\nusermod -aG sudo %s\nLog out and log back in to pick up the new group membership, then rerun this installer.\n' "$(id -un)" >&2
  fi
  exit 2
fi
if (( EUID != 0 )); then
  if ! sudo -v; then
    printf 'User "%s" cannot run sudo. Please log in as root, run: usermod -aG sudo %s\nLog out and log back in to pick up the new group membership, then rerun this installer.\n' "$(id -un)" "$(id -un)" >&2
    exit 2
  fi
fi
RED='' GREEN='' YELLOW='' BLUE='' BOLD='' RESET=''
if [[ -t 1 ]] && command -v tput >/dev/null && [[ $(tput colors 2>/dev/null || printf 0) -ge 8 ]]; then
  RED=$(tput setaf 1); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3)
  BLUE=$(tput setaf 4); BOLD=$(tput bold); RESET=$(tput sgr0)
fi
heading() { printf '  %s==>%s %s\n' "$BLUE" "$RESET" "$*"; }
success() { printf '  %s==>%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '  %s==>%s %s\n' "$YELLOW" "$RESET" "$*"; }
die() { printf '  %sERROR:%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

read_yes_no() {
  local prompt=$1 answer
  read -r -p "$prompt [y/N]: " answer
  [[ $answer =~ ^([yY]|[yY][eE][sS])$ ]]
}

# APT repository setup is repeated safely and keys are installed as dearmored keyrings.
install_apt_key() {
  local url=$1 destination=$2 temporary
  temporary=$(mktemp)
  if ! curl --fail --silent --show-error --location --retry 3 --retry-delay 2 "$url" -o "$temporary"; then
    rm -f "$temporary"
    die "Could not download repository key from $url"
  fi
  gpg --batch --yes --dearmor --output "$temporary.gpg" "$temporary" || { rm -f "$temporary" "$temporary.gpg"; die "Invalid repository key from $url"; }
  sudo install -o root -g root -m 0644 "$temporary.gpg" "$destination"
  rm -f "$temporary" "$temporary.gpg"
}

heading 'Installing prerequisites'
sudo apt-get update
sudo env DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt-get install -y \
  ca-certificates curl gnupg locales apt-transport-https

heading 'Removing previous Node.js installation and cache'
# Clear the invoking user's npm cache before purging the system-managed packages.
if command -v npm >/dev/null 2>&1; then
  npm cache clean --force || warn 'Could not clear the existing npm cache; continuing.'
fi
# Remove the invoking user's nvm installation because it can shadow the system Node.js.
if [[ -d "$HOME/.nvm" ]]; then
  rm -rf -- "$HOME/.nvm"
fi
sudo env DEBIAN_FRONTEND=noninteractive apt-get purge -y nodejs npm
# Clear legacy manually installed Node.js files from standard /usr/local locations.
sudo rm -f -- /usr/local/bin/node /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
sudo rm -rf -- /usr/local/lib/node_modules /usr/local/include/node
sudo find /usr/local/share/man -type f \( -name 'node.1*' -o -name 'npm-*' -o -name 'npx-*' -o -name 'corepack-*' \) -delete 2>/dev/null || true
sudo apt-get clean

heading 'Configuring Node.js repository'
sudo install -d -m 0755 /usr/share/keyrings
install_apt_key 'https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key' "$NODE_KEYRING"
printf 'deb [signed-by=%s] https://deb.nodesource.com/node_%s.x nodistro main\n' "$NODE_KEYRING" "$NODE_MAJOR" \
  | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null

heading 'Configuring Yarn repository'
install_apt_key 'https://dl.yarnpkg.com/debian/pubkey.gpg' "$YARN_KEYRING"
printf 'deb [signed-by=%s] https://dl.yarnpkg.com/debian/ stable main\n' "$YARN_KEYRING" \
  | sudo tee /etc/apt/sources.list.d/yarn.list >/dev/null

heading 'Configuring PostgreSQL repository'
install_apt_key 'https://www.postgresql.org/media/keys/ACCC4CF8.asc' "$PG_KEYRING"
pg_codename=${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}
[[ -n $pg_codename ]] || die 'Could not determine the OS codename for the PostgreSQL repository.'
printf 'deb [signed-by=%s] https://apt.postgresql.org/pub/repos/apt %s-pgdg main\n' "$PG_KEYRING" "$pg_codename" \
  | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null
heading 'Installing Node.js, Yarn, PostgreSQL, and build dependencies'
sudo apt-get update
sudo env DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt-get install -y \
  "nodejs" yarn "postgresql-${PG_MAJOR}" git bc wget build-essential python-is-python3 \
  pkg-config libtool autoconf automake libpq-dev jq libjemalloc-dev python3-setuptools

node_major=$(node --version | sed -E 's/^v([0-9]+).*/\1/')
[[ $node_major == "$NODE_MAJOR" ]] || die "The installed Node.js major version does not match the configured repository. Check APT pinning or existing packages."

heading 'Configuring UTF-8 locale'
if ! locale -a | grep -qiE '^en_US\.utf-?8$'; then
  if [[ -f /etc/locale.gen ]]; then
    sudo sed -i -E 's/^#?[[:space:]]*(en_US\.UTF-8 UTF-8)/\1/' /etc/locale.gen
  fi
  sudo locale-gen en_US.UTF-8
  sudo update-locale LANG=en_US.UTF-8
fi
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export LANGUAGE=en_US:en

heading 'Enabling time synchronization when available'
if command -v timedatectl >/dev/null; then
  sudo timedatectl set-ntp true || warn 'Could not enable NTP with timedatectl; continuing.'
fi

heading 'Installing PM2'
sudo npm install --global pm2@7
sudo pm2 install pm2-logrotate
sudo pm2 set pm2-logrotate:max_size 500M
sudo pm2 set pm2-logrotate:compress true
sudo pm2 set pm2-logrotate:retain 7

heading 'Installing ARK Core'
yarn global add "$CORE_PACKAGE"

# Persist PATH only if Yarn global binaries are not already present.
yarn_bin=$(yarn global bin)
if ! grep -Fq "$yarn_bin" "$HOME/.bashrc" 2>/dev/null; then
  printf '\n# Added by ARK Core installer\nexport PATH="%s:$PATH"\n' "$yarn_bin" >> "$HOME/.bashrc"
fi
export PATH="$yarn_bin:$PATH"
command -v ark >/dev/null || die 'ARK CLI was installed but is not on PATH.'
ark config:publish --network=devnet

success 'ARK Core and system dependencies are installed.'

if read_yes_no 'Would you like to configure a PostgreSQL user and database now?'; then
  read -r -p 'Database username: ' db_user
  read -r -s -p 'Database password: ' db_password; printf '\n'
  read -r -p 'Database name: ' db_name
  [[ -n $db_user && -n $db_password && -n $db_name ]] || die 'Username, password, and database name must be non-empty.'

  printf 'User: %s\nDatabase: %s\n' "$db_user" "$db_name"
  read_yes_no 'Create/update these database settings?' || die 'Database setup cancelled.'

  user_exists=$(sudo -u postgres psql -XAtq -v db_user="$db_user" -f - <<'SQL'
SELECT 1 FROM pg_roles WHERE rolname = :'db_user';
SQL
)
  db_exists=$(sudo -u postgres psql -XAtq -v db_name="$db_name" -f - <<'SQL'
SELECT 1 FROM pg_database WHERE datname = :'db_name';
SQL
)

  if [[ $user_exists == 1 ]]; then
    warn "Database role '$db_user' already exists; updating its password and CREATEDB privilege."
    sudo -u postgres psql -Xv ON_ERROR_STOP=1 -v db_user="$db_user" -v db_password="$db_password" -f - <<'SQL'
ALTER ROLE :"db_user" WITH LOGIN CREATEDB PASSWORD :'db_password';
SQL
  else
    sudo -u postgres psql -Xv ON_ERROR_STOP=1 -v db_user="$db_user" -v db_password="$db_password" -f - <<'SQL'
CREATE ROLE :"db_user" WITH LOGIN CREATEDB PASSWORD :'db_password';
SQL
  fi

  if [[ $db_exists == 1 ]]; then
    warn "Database '$db_name' exists. It will be kept and its owner will be changed."
    sudo -u postgres psql -Xv ON_ERROR_STOP=1 -v db_name="$db_name" -v db_user="$db_user" -f - <<'SQL'
ALTER DATABASE :"db_name" OWNER TO :"db_user";
SQL
  else
    sudo -u postgres psql -Xv ON_ERROR_STOP=1 -v db_name="$db_name" -v db_user="$db_user" -f - <<'SQL'
CREATE DATABASE :"db_name" OWNER :"db_user";
SQL
  fi

  ark env:set --key=CORE_DB_USERNAME --value="$db_user"
  ark env:set --key=CORE_DB_PASSWORD --value="$db_password"
  ark env:set --key=CORE_DB_DATABASE --value="$db_name"
  unset db_password
fi
success 'Setup complete.'
printf 'Open a new shell (or run: source ~/.bashrc) to load PATH and locale changes.\n'
