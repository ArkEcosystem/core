## ArkEcosystem Javascript API Client Examples

### `send-to-random-wallet`
This example sends 1 DARK to a random wallet if you've enough balance.

 * To use this example, it's necessary having a devnet wallet with at least 1.1 DARK.

To run it:
```
cd packages/client/examples
ARK_CLIENT_EXAMPLE_SENDER="devnet wallet address" ARK_CLIENT_EXAMPLE_PASS="the twelve words that forms the password of the wallet" ./post-transaction.js
```
