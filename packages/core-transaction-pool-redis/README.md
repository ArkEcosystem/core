![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - Transaction Pool Redis

## Installation

```bash
yarn add @arkecosystem/core-transaction-pool-redis
```

## Configuration

### Defaults

```js
module.exports = {
  enabled: true,
  key: 'ark',
  maxTransactionsPerSender: 100,
  whitelist: ['127.0.0.1', '192.168.*'],
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
