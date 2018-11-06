# Ark Core - API

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Installation

```bash
yarn add @arkecosystem/core-api
```

## Configuration

```js
module.exports = {
  enabled: !process.env.ARK_API_DISABLED,
  host: process.env.ARK_API_HOST || '0.0.0.0',
  port: process.env.ARK_API_PORT || 4003,
  versions: {
    default: 1,
    valid: [1, 2]
  },
  cache: {
    enabled: false,
    options: {}
  },
  rateLimit: {
    enabled: false,
    limit: 300,
    expires: 60000
  },
  pagination: {
    limit: 100,
    include: [
      '/api/v2/blocks',
      '/api/v2/blocks/{id}/transactions',
      '/api/v2/blocks/search',
      '/api/v2/delegates',
      '/api/v2/delegates/{id}/blocks',
      '/api/v2/delegates/{id}/voters',
      '/api/v2/delegates/search',
      '/api/v2/peers',
      '/api/v2/transactions',
      '/api/v2/transactions/search',
      '/api/v2/transactions/unconfirmed',
      '/api/v2/votes',
      '/api/v2/wallets',
      '/api/v2/wallets/top',
      '/api/v2/wallets/{id}/transactions',
      '/api/v2/wallets/{id}/transactions/received',
      '/api/v2/wallets/{id}/transactions/sent',
      '/api/v2/wallets/{id}/votes',
      '/api/v2/wallets/search'
    ]
  },
  whitelist: [
    '127.0.0.1',
    '::ffff:127.0.0.1'
  ]
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Kristjan Košič](https://github.com/kristjank)
- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
