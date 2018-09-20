![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - PostgreSQL Database Provider

## Installation

```bash
yarn add @arkecosystem/core-database-postgres
```

## Configuration

### Defaults

```js
module.exports = {
  initialization: {
    capSQL: true
  },
  connection: {
    host: process.env.ARK_DB_HOST || 'localhost',
    port: process.env.ARK_DB_PORT || 5432,
    database: process.env.ARK_DB_USERNAME || `ark_${process.env.ARK_NETWORK_NAME}`,
    user: process.env.ARK_DB_PASSWORD || 'ark',
    password: process.env.ARK_DB_DATABASE || 'password'
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
```

If you want to see all available configuration properties head over to https://github.com/vitaly-t/pg-promise.

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
