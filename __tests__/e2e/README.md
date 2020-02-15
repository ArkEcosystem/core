# Ark Core End-to-end Testing

<p align="center">
    <img src="./img/core-e2e-banner.png" />
</p>

[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](./LICENSE)

## Introduction

This project enables writing and running end-to-end tests on Ark core (v2).

## Install and run

First you need to have core setup and built :

`yarn setup`

Then you can go to the e2e folder and install the project dependencies :

`cd __tests__/e2e && yarn install`

Now to run the tests locally, you need to have Docker (and docker-compose) installed.

You can now run the configured tests like this :

```bash
cd lib/config && docker-compose up -d && cd ../.. # launches the network
bin/e2e run-tests # by default the main "scenario1" is run, see -s option for custom scenario
cd lib/config && docker-compose down -v && cd ../.. # shuts down the network
```

This will launch a network of 5 nodes on testnet and run the tests defined in `scenario1`. (it can take some time depending on your machine resources)

You can see the live output of the nodes by using the docker logs command :

```bash
docker logs config_core0_1 -f # for the first node (core0)
```

## Create new tests

### Structure of tests

To see the existing tests or create new tests, have a look at the `tests` folder. You will find 1 sub-folder : `scenarios`.

Let's have a look at the `scenarios` sub-folder.

    scenarios / scenario1 / config.js
    scenarios / scenario1 / doublespend1

So we find our `scenario1` that we executed before. It contains one file for configuration, and (currently) one sub-folder named `doublespend1` which contains one complete test case for double spending.

Let's first look at `config.js` :

    module.exports  = {
      enabledTests: [
        'doublespend1'
      ]
    }

Pretty straightforward : we enable the test cases we want to run.

A test case typically contains some actions to be executed on the network (transactions for example), and some tests to check that the behavior is correct. Let's have a look at the `doublespend1` folder :

    0.transfer-new-wallet.action.js
    1.doublespend.action.js
    2.check-tx.test.js
    config.js
    utils.js

We can notice a few things here :

-   The test case steps are prefixed by a number for clarity
-   The _actions_ steps are suffixed by `action.js` and the _test_ steps are suffixed by `.test.js`
-   There is a configuration file `config.js` and a helper file `utils.js`

`config.js` defines the steps to be run to execute the test case :

    module.exports  = {
      events: {
        newBlock: {
          8: [ '0.transfer-new-wallet.action' ],
          11: [ '1.doublespend.action' ],
          14: [ '2.check-tx.test' ]
        }
      }
    }

The steps are plugged into the network's events : right now the only events available are _new block_ events. Here we can see at block 8 we transfer some coins to a new wallet, then at block 11 we perform a _double spend_ action, finally at block 14 we check the last transactions (to see if the double spend was accepted by the network or not).

To create _action_ files, we just export (`module.export`) a function containing what we want to execute.

To create _test_ files, we write Jest tests as we would do with unit tests (`describe` etc).

You can have a look at `doublespend1` folder to have examples of actions and tests.

### Interact with the network through API

To perform some actions (like creating a new transaction), we want to send requests to one node's API.

The nodes between themselves interact through classic 4000 / 4003 ports. But to access the API externally there is a specific nginx server than will help us. It listens on port 4900 and you can access the nodes API through it this way :

```bash
curl 127.0.0.1:4900/core0/api/v2/blocks # use core1 for the 2nd node, etc
```

### Guidelines for writing tests

Here are some tips :

-   Create one folder for one coherent test case
-   Initialize what you need in your test case, don't re-use something from another test case : create your own wallets (transfer coins from genesis), your own transactions etc.
-   Use an `utils.js` file if you need, also have a look at `utils.js` in the `networks` folder and in the `lib` folder

## Github

The end-to-end tests are configured to run on Github for each commit.

## More details about the e2e docker architecture

You can have a look to the `lib/config` folder to understand how the network is working on docker, and you can for example increase the number of nodes you want to run by tweaking the docker-compose file and related core config folders.

## Suggestions, improvements

Please create new issues, or contact me if you want to discuss about it.
