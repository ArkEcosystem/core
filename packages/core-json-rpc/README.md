![ARK Core](https://i.imgur.com/1aP6F2o.png)

# ARK Core - JSON-RPC Server

## Installation

```bash
yarn add @arkecosystem/core-json-rpc
```

## Configuration

```js
module.exports = {
  enabled: !process.env.ARK_JSON_RPC_DISABLED,
  host: process.env.ARK_JSON_RPC_HOST || '0.0.0.0',
  port: process.env.ARK_JSON_RPC_PORT || 8080,
  allowRemote: true,
  whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*']
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [François-Xavier Thoorens](https://github.com/fix)
- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
