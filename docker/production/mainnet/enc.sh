#!/usr/bin/env bash
##########################################################################
#									 #
# This script encrypts your forging secret as well as your password.	 #
# Put them in the corresponding variable names $SECRET="" and $BIP38="". #
# Execute script after that. It will create a local folder named `enc`	 #
# containing all needed stuff. After starting your Docker container	 #
# it is desirable to delete that folder (`rm -rf enc`) and remove		 #
# previously entered secret and password.				 #	
#									 #
##########################################################################

SECRET="this is not a secret"   ### <= Your secret here
BIP38="password"                ### <= Your password here

### Stop edit here

rm -rf enc > /dev/null 2>&1
mkdir enc; cd enc

openssl genrsa -out secret.key 2048
openssl rsa -in secret.key -out secret.pub -outform PEM -pubout
echo "${SECRET}" | openssl rsautl -encrypt -inkey secret.pub -pubin -out secret.dat 

openssl genrsa -out bip.key 2048
openssl rsa -in bip.key -out bip.pub -outform PEM -pubout
echo "${BIP38}" | openssl rsautl -encrypt -inkey bip.pub -pubin -out bip.dat

