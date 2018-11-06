# Ark Core - Elasticsearch

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Installation

```bash
yarn add @arkecosystem/core-elasticsearch
```

## Configuration

```js
module.exports = {
  server: {
    host: '0.0.0.0',
    port: 4007,
    whitelist: ['*']
  },
  client: {
    host: 'localhost:9200',
    log: 'info'
  },
  chunkSize: 50000
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
