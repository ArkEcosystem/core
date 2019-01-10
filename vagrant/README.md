## Requirements
 - Vagrant
 - Virtualbox

## Setup
```bash
git clone https://github.com/arkecosystem/core
cd core/vagrant
vagrant up
```

This will open a new VirtualBox VM, where you'll be able to run a few configuration commands and get up and running for Ark Core development.

Once inside the Ubuntu VM, you need to take care of:

 1. Installing yarn and setting up the core codebase
 2. Setting up a PostgreSQL database for devnet
 3. Testing your development environment

### Installing yarn
In the virtual machine, open up a terminal and issue the following commands:

```bash
npm i -g yarn
yarn global add lerna
cd /home/vagrant/core
yarn install
yarn setup
```

With those steps taken care of, you can start writing and executing tests against the codebase after running the docker-compose development configuration:

```bash
cd /home/vagrant/core/docker/development
sudo docker-compose up -d
```

If you require running a full devnet node, you must proceed to setting up a PostgreSQL database for devnet.

### Setting up PostgreSQL
You must first create a role for the default vagrant and give the user permission to create a database:

```bash
sudo -u psql -c "CREATE USER vagrant WITH PASSWORD 'vagrant' CREATEDB;"
```

If you get any errors, make sure the postgrsql service is running and enabled:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Then, you can proceed to creating a database for Ark Devnet:

```bash
createdb ark_devnet
```

Finally, make sure that the user 'ark' with password 'password' is able to use PostgreSQL:

```bash
CREATE USER ark WITH PASSWORD 'password';
```

You should then be able to running a devnet relay node.

### Testing your Setup
Go to the core directory's core package, where the node binaries are located, and start the devnet node:

```bash
cd /home/vagrant/core/packages/core
yarn relay:devnet
```

You should then see the output confirming that the database and codebase are properly configured; the node will eventually start synchronizing.

### Notes
If you would like to run development tests only and have configured postgresql for running a devnet node, you will first need to make sure your postgresql service is stopped or you will get a ECONNREFUSED error:

```bash
sudo systemctl stop postgresql
```

Then you should be able to run tests when the docker-compose development configuration is up.


