# Ark Core End-to-end Testing

<p align="center">
    <img src="./img/core-e2e-banner.png" />
</p>

[![Build Status](https://badgen.now.sh/circleci/github/ArkEcosystem/core-e2e)](https://circleci.com/gh/ArkEcosystem/core-e2e)
[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](./LICENSE)

## Introduction

This project enables writing and running end-to-end tests on Ark core (v2).

## Install and run

Install the project dependencies :

`npm install`

Now to run the tests locally, you need to have Docker installed. Then, run this command to initialize docker swarm feature :

`docker swarm init`

You can now run the configured tests like this :

    bin/e2e generate -n e2enet -c 3
    sudo chmod +x dist/e2enet/docker*
    cd dist/e2enet && ./docker-init.sh && ./docker-start.sh && cd ../..
    bin/e2e run-tests -n e2enet -s scenario1

This will generate the configured network `e2enet` with 3 nodes and run the tests defined in `scenario1`. (it can take some time depending on your machine resources)

## Create new tests

### Structure of tests

To see the existing tests or create new tests, have a look at the `tests` folder. You will find 2 sub-folders : `networks` and `scenarios`.

We will just look at the `scenarios` sub-folder as we don't want to set up a new network, we already have the default `e2enet` which we will use.

    scenarios / scenario1 / config.js
    scenarios / scenario1 / doublespend1

So we find our `scenario1` that we executed before. It contains one file for configuration, and (currently) one sub-folder named `doublespend1` which contains one complete test case for double spending.

Let's first look at `config.js` :

    module.exports  = {
      network: 'e2enet',
      enabledTests: [
        'doublespend1'
      ]
    }

Pretty straightforward : the network on which we want to execute the scenario, and the test cases we want to run on it.

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

The nodes between themselves interact through classic 4000 / 4003 ports. But externally their ports are mapped so in our test we interact with them differently :

-   For API calls we request localhost on port ( 4300 + node number ) to access a specific node (node numbers start from zero, so node0 will be requested on port 4300, node1 on port 4301...)
-   For P2P calls we request localhost on port ( 4000 + node number )

### Guidelines for writing tests

Here are some tips :

-   Create one folder for one coherent test case
-   Initialize what you need in your test case, don't re-use something from another test case : create your own wallets (transfer coins from genesis), your own transactions etc.
-   Use an `utils.js` file if you need, also have a look at `utils.js` in the `networks` folder and in the `lib` folder

## CircleCI

The end-to-end tests are configured to run on CircleCI every day : to see which network and scenarios are configured, you can have a look at `.circleci/config.yml`file.

## Technical details about this project

To understand how this end-to-end testing framework works behind the scenes, have a look at [TechnicalDetails.md](TechnicalDetails.md).

## Suggestions, improvements

Please create new issues, or contact me if you want to discuss about it.
