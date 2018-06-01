![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - Webhooks

## Installation

```bash
yarn add @arkecosystem/core-webhooks
```

## Configuration

```js
module.exports = {
  enabled: true,
  database: {
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/webhooks.sqlite`,
    logging: false
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  },
  events: [{
    name: 'block.applied',
    description: 'n/a'
  }, {
    name: 'block.forged',
    description: 'n/a'
  }, {
    name: 'block.reverted',
    description: 'n/a'
  }, {
    name: 'delegate.registered',
    description: 'n/a'
  }, {
    name: 'delegate.resigned',
    description: 'n/a'
  }, {
    name: 'forger.failed',
    description: 'n/a'
  }, {
    name: 'forger.missing',
    description: 'n/a'
  }, {
    name: 'forger.started',
    description: 'n/a'
  }, {
    name: 'peer.added',
    description: 'n/a'
  }, {
    name: 'peer.removed',
    description: 'n/a'
  }, {
    name: 'transaction.applied',
    description: 'n/a'
  }, {
    name: 'transaction.expired',
    description: 'n/a'
  }, {
    name: 'transaction.forged',
    description: 'n/a'
  }, {
    name: 'transaction.reverted',
    description: 'n/a'
  }, {
    name: 'wallet.vote',
    description: 'n/a'
  }, {
    name: 'wallet.unvote',
    description: 'n/a'
  }]
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
