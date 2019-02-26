#!/usr/bin/env bash
##########################################################
#                                                        #
# This script encrypts your forging secret and password. #
#                                                        #
##########################################################

type openssl >/dev/null 2>&1 || { echo >&2 "OpenSSL missing. Please install and run the script again."; exit 1; }

yellow=$(tput setaf 3)
green=$(tput setaf 2)
lila=$(tput setaf 4)
bold=$(tput bold)
reset=$(tput sgr0)

warning ()
{
    echo "    ${yellow}==>${reset}${bold} $1${reset}"
}

success ()
{
    echo "    ${green}==>${reset}${bold} $1${reset}"
}

read -sp "Please enter your delegate secret: " inputSecret
echo

while true; do
    read -sp "Please enter your password: " inputPass
    echo
    read -sp "Please enter password again: " inputPassA
    echo
    [ "${inputPass}" = "${inputPassA}" ] && break
    echo "Password do not match! Please try again."
done

SECRET="${inputSecret}"
BIP38="${inputPass}"

rm -rf enc > /dev/null 2>&1
mkdir enc; cd enc

warning "Encrypting ..."

openssl genrsa -out secret.key 2048
openssl rsa -in secret.key -out secret.pub -outform PEM -pubout
echo "${SECRET}" | openssl rsautl -encrypt -inkey secret.pub -pubin -out secret.dat

openssl genrsa -out bip.key 2048
openssl rsa -in bip.key -out bip.pub -outform PEM -pubout
echo "${BIP38}" | openssl rsautl -encrypt -inkey bip.pub -pubin -out bip.dat

success "Done! Created folder $(echo "${lila}enc${reset}") with all certificates and keys inside."
success "You are now ready to run your docker $(echo "${yellow}forger")."

