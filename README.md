# Ark Core

<p align="center">
    <img src="./banner.png" />
</p>

[![Build Status](https://badgen.now.sh/circleci/github/ArkEcosystem/core)](https://circleci.com/gh/ArkEcosystem/core)
[![Codecov](https://badgen.now.sh/codecov/c/github/arkecosystem/core)](https://codecov.io/gh/arkecosystem/core)
[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](https://opensource.org/licenses/MIT)

## Introduction

This repository contains all plugins that make up the Ark Core.

## Documentation

- Development : https://docs.ark.io/guidebook/core/development.html
- Docker : https://docs.ark.io/guidebook/core/docker.html

## API Documentation

- API v1 : https://docs.ark.io/api/public/v1/
- API v2 : https://docs.ark.io/api/public/v2/

## GitHub Development Bounty

- Get involved with Ark development and start earning ARK : https://bounty.ark.io

## Core Packages

| Package                                                  | Version                                                                                                                                           | Description                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **[core](/packages/core)**                               | [![npm](https://img.shields.io/npm/v/@arkecosystem/core.svg)](https://www.npmjs.com/package/@arkecosystem/core)                                   | **Includes all packages**  |
| [core-api](/packages/core-api)                           | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-api.svg)](https://www.npmjs.com/package/@arkecosystem/core-api)                           | Public API                 |
| [core-blockchain](/packages/core-blockchain)             | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-blockchain.svg)](https://www.npmjs.com/package/@arkecosystem/core-blockchain)             | Blockchain Management      |
| [core-config](/packages/core-config)                     | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-config.svg)](https://www.npmjs.com/package/@arkecosystem/core-config)                     | Configuration Loader       |
| [core-container](/packages/core-container)               | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-container.svg)](https://www.npmjs.com/package/@arkecosystem/core-container)               | Container Management       |
| [core-database](/packages/core-database)                 | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-database.svg)](https://www.npmjs.com/package/@arkecosystem/core-database)                 | Database Interface         |
| [core-deployer](/packages/core-deployer)                 | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-deployer.svg)](https://www.npmjs.com/package/@arkecosystem/core-deployer)                 | Deployer CLI               |
| [core-event-emitter](/packages/core-event-emitter)       | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-event-emitter.svg)](https://www.npmjs.com/package/@arkecosystem/core-event-emitter)       | Event Manager              |
| [core-forger](/packages/core-forger)                     | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-forger.svg)](https://www.npmjs.com/package/@arkecosystem/core-forger)                     | Forger Manager             |
| [core-graphql](/packages/core-graphql)                   | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-graphql.svg)](https://www.npmjs.com/package/@arkecosystem/core-graphql)                   | GraphQL Provider           |
| [core-json-rpc](/packages/core-json-rpc)                 | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-json-rpc.svg)](https://www.npmjs.com/package/@arkecosystem/core-json-rpc)                 | JSON-RPC Server            |
| [core-logger](/packages/core-logger)                     | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-logger.svg)](https://www.npmjs.com/package/@arkecosystem/core-logger)                     | Logger Manager             |
| [core-logger-winston](/packages/core-logger-winston)     | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-logger-winston.svg)](https://www.npmjs.com/package/@arkecosystem/core-logger-winston)     | Winston Logger Provider    |
| [core-p2p](/packages/core-p2p)                           | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-p2p.svg)](https://www.npmjs.com/package/@arkecosystem/core-p2p)                           | P2P API                    |
| [test-utils](/packages/core-test-utils)                  | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-test-utils.svg)](https://www.npmjs.com/package/@arkecosystem/core-test-utils)             | Test Utilities             |
| [tester-cli](/packages/core-tester-cli)                  | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-tester-cli.svg)](https://www.npmjs.com/package/@arkecosystem/core-tester-cli)             | Tester CLI                 |
| [core-transaction-pool](/packages/core-transaction-pool) | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-transaction-pool.svg)](https://www.npmjs.com/package/@arkecosystem/core-transaction-pool) | Transaction Pool Interface |
| [core-webhooks](/packages/core-webhooks)                 | [![npm](https://img.shields.io/npm/v/@arkecosystem/core-webhooks.svg)](https://www.npmjs.com/package/@arkecosystem/core-webhooks)                 | Webhooks Manager           |
| [crypto](/packages/crypto)                               | [![npm](https://img.shields.io/npm/v/@arkecosystem/crypto.svg)](https://www.npmjs.com/package/@arkecosystem/crypto)                               | Crypto Utilities           |

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [François-Xavier Thoorens](https://github.com/fix)
- [Kristjan Košič](https://github.com/kristjank)
- [Brian Faust](https://github.com/faustbrian)
- [Alex Barnsley](https://github.com/alexbarnsley)
- [All Contributors](../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
