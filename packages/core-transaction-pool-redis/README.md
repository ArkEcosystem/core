![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - Transaction Pool Redis

## Installation

```bash
yarn add @arkecosystem/core-transaction-pool-redis
```

## Configuration

```js
module.exports = {
  enabled: !process.env.ARK_TRANSACTION_POOL_DISABLED,
  key: 'ark',
  maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 200,
  whitelist: [],
  allowedSenders: [],
  maxTransactionsPerRequest: 150,
  maxTransactionAge: 21600,
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Kristjan Košič](https://github.com/kristjank)
- [Brian Faust](https://github.com/faustbrian)
- [Alex Barnsley](https://github.com/alexbarnsley)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
