# @arkecosystem/peers

<p align="center">
    <img src="https://raw.githubusercontent.com/ARKEcosystem/peers/master/banner.png" />
</p>

[![Latest Version](https://badgen.now.sh/npm/v/@arkecosystem/peers)](https://www.npmjs.com/package/@arkecosystem/peers)
[![Node Engine](https://badgen.now.sh/npm/node/@arkecosystem/peers)](https://www.npmjs.com/package/@arkecosystem/peers)
[![Build Status](https://badgen.now.sh/circleci/github/ArkEcosystem/typescript-peers)](https://circleci.com/gh/ArkEcosystem/typescript-peers)
[![Codecov](https://badgen.now.sh/codecov/c/github/ArkEcosystem/typescript-peers)](https://codecov.io/gh/ArkEcosystem/typescript-peers)
[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](https://opensource.org/licenses/MIT)

> Lead Maintainer: [Brian Faust](https://github.com/faustbrian)

## Installation

```bash
yarn add @arkecosystem/peers
```

## Usage

### Peers via GitHub

```ts
import { PeerDiscovery } from "@arkecosystem/peers";

await PeerDiscovery.new("devnet")
	.withVersion(">=2.4.0-next.0")
	.withLatency(300)
	.sortBy("latency")
	.findPeersWithPlugin("core-api");
```

### Peers via Relay

```ts
import { PeerDiscovery } from "@arkecosystem/peers";

await PeerDiscovery.new("http://dexplorer.ark.io/api/v2/peers")
	.withVersion(">=2.4.0-next.0")
	.withLatency(300)
	.sortBy("latency")
	.findPeersWithPlugin("core-api");
```

## Testing

```bash
yarn test
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

This project exists thanks to all the people who [contribute](../../contributors).

## License

[MIT](LICENSE) © [ARK Ecosystem](https://ark.io)
