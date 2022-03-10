# Socket event forwarder
A bridgechian plugin for forwarding real-time blockchain events through socket.io.

Supported blockchain events can be found [here.](https://github.com/ArkEcosystem/core/blob/develop/packages/core-kernel/src/enums/events.ts)

## Custom events

- `transaction.confirmed` fired when a transaction is confirmed for a configurable amount of times.
- `systeminformation` fires system information like CPU, memory and filesystem stats at an configurable interval.
- `network.latency` fires the stats of a HTTP request to measure latency in milliseconds at an configurable interval.
- `blockheight.current` fires the current synced blockheight at an configurable interval.

## Installation
### Yarn
Use these steps if you installed your node using Yarn.
1. `yarn global add @foly/socket-event-forwarder`.
2. Customize the plugin configuration to your needs.
3. Add the configuration to `~/.config/{bridgechain-core}/{mainnet|devnet|testnet}/app.json` at the bottom of relay.plugins.
3. Restart your relay process.

### Git source
Use these steps if you installed your node using Git clone.
1. Go to the plugin directory `cd ~/{bridgechain-core}/plugins`.
2. Clone the plugin `git clone https://github.com/e-m-s-y/socket-event-forwarder`.
3. Install and build the plugin `cd socket-event-forwarder && yarn install && yarn compile`.
4. Bootstrap the plugin using `cd .. && yarn bootstrap`.
5. Customize the plugin configuration to your needs.
6. Add the configuration to `~/.config/{bridgechain-core}/{mainnet|devnet|testnet}/app.json` at the bottom of relay.plugins.
7. Restart your relay process.

#### Plugin configuration example
```js
{
    "package": "@foly/socket-event-forwarder",
    "options": {
        "enabled": true,
        "port": 3333,
        "events": [
            "block.applied",
            "block.forged",
            "round.applied",
            "transaction.applied",
        ],
        "confirmations": [1, 2, 3, 4, 5],
        "customEvents": [
            "transaction.confirmed",
            "systeminformation",
            "network.latency",
            "blockheight.current"
        ],
        "systeminformationInterval": 5000,
        "networkLatencyInterval": 10000,
        "blockheightCurrentInterval": 5000
    }
}
```

## Examples
Delegate friendsoflittleyus provides several public endpoints for you to use, check out [our website](https://friendsoflittleyus.nl/ark-bridgechain-plugins/socket-event-forwarder/) for examples and additional information.

## Credits

- [e-m-s-y](https://github.com/e-m-s-y)

## License

[MIT](LICENSE)
