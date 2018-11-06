# Ark Core - Webhooks

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Installation

```bash
yarn add @arkecosystem/core-webhooks
```

## Configuration

```js
module.exports = {
  enabled: !process.env.ARK_WEBHOOKS_DISABLED,
  database: {
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/webhooks.sqlite`,
    logging: process.env.ARK_DB_LOGGING
  },
  server: {
    enabled: process.env.ARK_WEBHOOKS_API_ENABLED,
    host: process.env.ARK_WEBHOOKS_HOST || '0.0.0.0',
    port: process.env.ARK_WEBHOOKS_PORT || 4004,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
    pagination: {
      limit: 100,
      include: [
        '/api/webhooks'
      ]
    }
  }
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
