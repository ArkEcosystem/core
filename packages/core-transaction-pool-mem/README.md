# Ark Core - Transaction Pool (Mem)

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Installation

```bash
yarn add @arkecosystem/core-transaction-pool-mem
```

## Configuration

```js
module.exports = {
  enabled: !process.env.ARK_TRANSACTION_POOL_DISABLED,
  syncInterval: 512,
  storage: `${process.env.ARK_PATH_DATA}/database/transaction-pool-${process.env.ARK_NETWORK_NAME}.sqlite`,
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 300,
  whitelist: [],
  allowedSenders: [],
  maxTransactionsPerRequest: 200,
  maxTransactionAge: 21600
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Kristjan Košič](https://github.com/kristjank)
- [Brian Faust](https://github.com/faustbrian)
- [Alex Barnsley](https://github.com/alexbarnsley)
- [Vasil Dimov](https://github.com/vasild)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
